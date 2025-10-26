import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';
import { UpdateAutoReplyDto } from './dto/update-auto-reply.dto';
import { AiService, MerchantContext } from '../ai/ai.service';
import { MerchantService } from '../merchant/merchant.service';

@Injectable()
export class AutoReplyService {
  private readonly logger = new Logger(AutoReplyService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private merchantService: MerchantService,
  ) {}

  // 创建自动回复
  async create(createAutoReplyDto: CreateAutoReplyDto) {
    return this.prisma.autoReply.create({
      data: createAutoReplyDto,
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  // 获取所有自动回复
  async findAll(activeOnly: boolean = false) {
    return this.prisma.autoReply.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  // 获取单个自动回复
  async findOne(id: string) {
    const autoReply = await this.prisma.autoReply.findUnique({
      where: { id },
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!autoReply) {
      throw new NotFoundException(`Auto reply with ID ${id} not found`);
    }

    return autoReply;
  }

  // 根据消息内容匹配自动回复
  async findMatchingReply(message: string, sessionId: string) {
    // 检查自动回复是否被暂停
    const isPaused = await this.isAutoReplyPaused(sessionId);
    if (isPaused) {
      return null;
    }

    // 验证输入消息
    if (!message || !message.trim()) {
      return null;
    }

    const lowerMessage = message.toLowerCase().trim();

    // 获取所有激活的自动回复，按优先级排序
    const autoReplies = await this.prisma.autoReply.findMany({
      where: { isActive: true },
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // 优先匹配关键词触发的回复
    for (const reply of autoReplies) {
      if (reply.triggerType === 'keyword' && reply.keywords) {
        const keywords = Array.isArray(reply.keywords) 
          ? reply.keywords 
          : (reply.keywords as any)?.keywords || [];
        
        for (const keyword of keywords) {
          if (keyword && keyword.trim() && lowerMessage.includes(keyword.toLowerCase().trim())) {
            // 如果匹配的回复启用了关键词AI，使用AI生成回复
            if (reply.keywordAIEnabled) {
              this.logger.debug(`触发关键词AI回复: ${reply.name}`);
              return await this.generateKeywordAiReply(message, reply, sessionId);
            }
            // 如果匹配的回复启用了AI，使用AI生成回复
            if (reply.useAI) {
              this.logger.debug(`触发普通AI回复: ${reply.name}`);
              return await this.generateAiReply(message, reply, sessionId);
            }
            // 否则返回固定回复
            if (reply.message && reply.message.trim()) {
              this.logger.debug(`触发固定回复: ${reply.name}`);
              return reply;
            }
          }
        }
      }
    }

    // 寻找AI类型的回复
    const aiReply = autoReplies.find(r => r.triggerType === 'ai' && r.isActive);
    if (aiReply) {
      return await this.generateAiReply(message, aiReply, sessionId);
    }

    // 寻找启用AI的默认回复
    const defaultReply = autoReplies.find(r => r.triggerType === 'default' && r.isActive);
    if (defaultReply) {
      if (defaultReply.useAI) {
        return await this.generateAiReply(message, defaultReply, sessionId);
      }
      if (defaultReply.message && defaultReply.message.trim()) {
        return defaultReply;
      }
    }

    // 检查是否启用默认AI回复
    const merchantInfo = await this.merchantService.findActive();
    this.logger.debug(`检查默认AI回复: merchantInfo=${!!merchantInfo}, defaultAIEnabled=${merchantInfo?.defaultAIEnabled}`);
    if (merchantInfo && merchantInfo.defaultAIEnabled) {
      this.logger.debug('触发默认AI回复');
      return await this.generateDefaultAiReply(message, sessionId);
    }

    return null;
  }

  // 生成关键词AI回复
  private async generateKeywordAiReply(userMessage: string, autoReply: any, sessionId: string) {
    try {
      // 获取商家信息
      const merchantInfo = await this.merchantService.findActive();
      if (!merchantInfo || !merchantInfo.aiConfig) {
        this.logger.warn('商家信息或AI配置未找到，返回默认消息');
        return {
          ...autoReply,
          message: autoReply.message || '抱歉，暂时无法为您提供智能回复，请联系客服获得帮助。'
        };
      }

      // 构建商家上下文
      const services: string[] = Array.isArray(merchantInfo.services) 
        ? merchantInfo.services.filter((s): s is string => typeof s === 'string')
        : [];
        
      const advantages = Array.isArray(merchantInfo.advantages)
        ? merchantInfo.advantages.filter((a): a is string => typeof a === 'string').join('、')
        : '';

      const merchantContext: MerchantContext = {
        businessName: merchantInfo.businessName || merchantInfo.name || '未知商家',
        businessType: merchantInfo.businessType || '服务商家',
        businessDescription: merchantInfo.businessDescription || merchantInfo.description || '',
        location: merchantInfo.location || '未知地区',
        contactPhone: merchantInfo.contactPhone || (merchantInfo.contact as any)?.phone || '未提供',
        contactEmail: merchantInfo.contactEmail || (merchantInfo.contact as any)?.email,
        businessHours: merchantInfo.businessHours || '营业时间请咨询',
        services,
        specialOffers: merchantInfo.specialOffers,
        targetAudience: merchantInfo.targetAudience || '所有客户',
        businessAdvantages: merchantInfo.businessAdvantages || advantages,
      };

      // 安全地获取AI配置
      const aiConfigData = merchantInfo.aiConfig as any;
      if (!aiConfigData || typeof aiConfigData !== 'object') {
        throw new Error('AI配置无效');
      }

      // 使用指定的AI模型或默认模型
      const aiConfig = {
        defaultModel: autoReply.aiModel || aiConfigData.defaultModel || 'deepseek-v3.1-250821',
        systemPrompt: aiConfigData.systemPrompt || '你是一个专业的客服助理。',
        maxTokens: aiConfigData.maxTokens || 2000,
        temperature: aiConfigData.temperature || 0.7,
        apiKey: aiConfigData.apiKey || '',
        apiSecret: aiConfigData.apiSecret || '',
      };

      // 使用关键词AI提示词或系统提示词
      const prompt = autoReply.keywordAIPrompt || aiConfig.systemPrompt;

      // 生成AI回复
      const aiResponse = await this.aiService.generateResponse(
        userMessage,
        aiConfig,
        merchantContext,
        prompt
      );

      // 返回包含AI生成内容的回复对象
      return {
        ...autoReply,
        message: aiResponse,
        isAiGenerated: true, // 标记为AI生成
      };

    } catch (error) {
      this.logger.error(`关键词AI回复生成失败: ${error.message}`, error);
      
      // AI失败时返回备用消息
      return {
        ...autoReply,
        message: autoReply.message || '抱歉，暂时无法为您提供智能回复，请联系客服获得帮助。'
      };
    }
  }

  // 生成默认AI回复
  async generateDefaultAiReply(userMessage: string, sessionId: string) {
    try {
      this.logger.debug(`开始生成默认AI回复: ${userMessage}`);
      
      // 获取商家信息
      const merchantInfo = await this.merchantService.findActive();
      if (!merchantInfo || !merchantInfo.aiConfig) {
        this.logger.warn('商家信息或AI配置未找到，无法生成默认AI回复');
        return null;
      }
      
      this.logger.debug(`商家信息找到: ${merchantInfo.businessName}, 默认AI启用: ${merchantInfo.defaultAIEnabled}`);

      // 构建商家上下文
      const services: string[] = Array.isArray(merchantInfo.services) 
        ? merchantInfo.services.filter((s): s is string => typeof s === 'string')
        : [];
        
      const advantages = Array.isArray(merchantInfo.advantages)
        ? merchantInfo.advantages.filter((a): a is string => typeof a === 'string').join('、')
        : '';

      const merchantContext: MerchantContext = {
        businessName: merchantInfo.businessName || merchantInfo.name || '未知商家',
        businessType: merchantInfo.businessType || '服务商家',
        businessDescription: merchantInfo.businessDescription || merchantInfo.description || '',
        location: merchantInfo.location || '未知地区',
        contactPhone: merchantInfo.contactPhone || (merchantInfo.contact as any)?.phone || '未提供',
        contactEmail: merchantInfo.contactEmail || (merchantInfo.contact as any)?.email,
        businessHours: merchantInfo.businessHours || '营业时间请咨询',
        services,
        specialOffers: merchantInfo.specialOffers,
        targetAudience: merchantInfo.targetAudience || '所有客户',
        businessAdvantages: merchantInfo.businessAdvantages || advantages,
      };

      // 安全地获取AI配置
      const aiConfigData = merchantInfo.aiConfig as any;
      if (!aiConfigData || typeof aiConfigData !== 'object') {
        throw new Error('AI配置无效');
      }

      // 使用默认AI配置
      const aiConfig = {
        defaultModel: aiConfigData.defaultModel || 'deepseek-v3.1-250821',
        systemPrompt: aiConfigData.systemPrompt || '你是一个专业的客服助理。',
        maxTokens: aiConfigData.maxTokens || 2000,
        temperature: aiConfigData.temperature || 0.7,
        apiKey: aiConfigData.apiKey || '',
        apiSecret: aiConfigData.apiSecret || '',
      };

      // 使用默认AI提示词或系统提示词
      const prompt = merchantInfo.defaultAIPrompt || aiConfig.systemPrompt;

      // 生成AI回复
      const aiResponse = await this.aiService.generateResponse(
        userMessage,
        aiConfig,
        merchantContext,
        prompt
      );

      // 返回默认AI回复对象
      return {
        id: 'default-ai',
        name: '默认AI回复',
        triggerType: 'default',
        priority: merchantInfo.defaultAIPriority || 5,
        message: aiResponse,
        isAiGenerated: true,
        isDefaultAI: true,
      };

    } catch (error) {
      this.logger.error(`默认AI回复生成失败: ${error.message}`, error);
      return null;
    }
  }

  // 生成AI回复
  private async generateAiReply(userMessage: string, autoReply: any, sessionId: string) {
    try {
      // 获取商家信息
      const merchantInfo = await this.merchantService.findActive();
      if (!merchantInfo || !merchantInfo.aiConfig) {
        this.logger.warn('商家信息或AI配置未找到，返回默认消息');
        return {
          ...autoReply,
          message: autoReply.message || '抱歉，暂时无法为您提供智能回复，请联系客服获得帮助。'
        };
      }

      // 构建商家上下文
      const services: string[] = Array.isArray(merchantInfo.services) 
        ? merchantInfo.services.filter((s): s is string => typeof s === 'string')
        : [];
        
      const advantages = Array.isArray(merchantInfo.advantages)
        ? merchantInfo.advantages.filter((a): a is string => typeof a === 'string').join('、')
        : '';

      const merchantContext: MerchantContext = {
        businessName: merchantInfo.businessName || merchantInfo.name || '未知商家',
        businessType: merchantInfo.businessType || '服务商家',
        businessDescription: merchantInfo.businessDescription || merchantInfo.description || '',
        location: merchantInfo.location || '未知地区',
        contactPhone: merchantInfo.contactPhone || (merchantInfo.contact as any)?.phone || '未提供',
        contactEmail: merchantInfo.contactEmail || (merchantInfo.contact as any)?.email,
        businessHours: merchantInfo.businessHours || '营业时间请咨询',
        services,
        specialOffers: merchantInfo.specialOffers,
        targetAudience: merchantInfo.targetAudience || '所有客户',
        businessAdvantages: merchantInfo.businessAdvantages || advantages,
      };

      // 安全地获取AI配置
      const aiConfigData = merchantInfo.aiConfig as any;
      if (!aiConfigData || typeof aiConfigData !== 'object') {
        throw new Error('AI配置无效');
      }

      // 使用指定的AI模型或默认模型
      const aiConfig = {
        defaultModel: autoReply.aiModel || aiConfigData.defaultModel || 'deepseek-v3.1-250821',
        systemPrompt: aiConfigData.systemPrompt || '你是一个专业的客服助理。',
        maxTokens: aiConfigData.maxTokens || 2000,
        temperature: aiConfigData.temperature || 0.7,
        apiKey: aiConfigData.apiKey || '',
        apiSecret: aiConfigData.apiSecret || '',
      };

      // 生成AI回复
      const aiResponse = await this.aiService.generateResponse(
        userMessage,
        aiConfig,
        merchantContext,
        autoReply.aiPrompt
      );

      // 返回包含AI生成内容的回复对象
      return {
        ...autoReply,
        message: aiResponse,
        isAiGenerated: true, // 标记为AI生成
      };

    } catch (error) {
      this.logger.error(`AI回复生成失败: ${error.message}`, error);
      
      // AI失败时返回备用消息
      return {
        ...autoReply,
        message: autoReply.message || '抱歉，暂时无法为您提供智能回复，请联系客服获得帮助。'
      };
    }
  }

  // 获取默认回复
  async getDefaultReply() {
    const defaultReply = await this.prisma.autoReply.findFirst({
      where: {
        triggerType: 'default',
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    return defaultReply;
  }

  // 检查是否为欢迎语消息
  async isWelcomeMessage(autoReplyId: string) {
    const autoReply = await this.prisma.autoReply.findUnique({
      where: { id: autoReplyId },
    });
    return autoReply && autoReply.triggerType === 'welcome';
  }

  // 获取欢迎语
  async getWelcomeMessage() {
    const welcomeReply = await this.prisma.autoReply.findFirst({
      where: {
        triggerType: 'welcome',
        isActive: true,
      },
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
    });

    return welcomeReply;
  }

  // 更新自动回复
  async update(id: string, updateAutoReplyDto: UpdateAutoReplyDto) {
    return this.prisma.autoReply.update({
      where: { id },
      data: updateAutoReplyDto,
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  // 删除自动回复
  async remove(id: string) {
    return this.prisma.autoReply.delete({
      where: { id },
    });
  }

  // 切换激活状态
  async toggleActive(id: string) {
    const autoReply = await this.findOne(id);
    return this.prisma.autoReply.update({
      where: { id },
      data: {
        isActive: !autoReply.isActive,
      },
    });
  }

  // 暂停自动回复
  async pauseAutoReply(sessionId: string, durationMinutes: number, reason: string) {
    const pausedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    await this.prisma.autoReplyPause.upsert({
      where: { sessionId },
      create: {
        sessionId,
        pausedUntil,
        reason,
      },
      update: {
        pausedUntil,
        reason,
      },
    });

    return { success: true, pausedUntil };
  }

  // 检查自动回复是否被暂停
  async isAutoReplyPaused(sessionId: string): Promise<boolean> {
    const pause = await this.prisma.autoReplyPause.findUnique({
      where: { sessionId },
    });

    if (!pause) {
      return false;
    }

    const now = new Date();
    if (pause.pausedUntil > now) {
      // 仍在暂停期
      return true;
    }

    // 暂停期已过，删除记录
    await this.prisma.autoReplyPause.delete({
      where: { sessionId },
    });

    return false;
  }

  // 恢复自动回复
  async resumeAutoReply(sessionId: string) {
    try {
      await this.prisma.autoReplyPause.delete({
        where: { sessionId },
      });
      return { success: true };
    } catch (error) {
      // 如果记录不存在，也返回成功
      return { success: true };
    }
  }

  // 清理过期的暂停记录
  async cleanupExpiredPauses() {
    const now = new Date();
    const deleted = await this.prisma.autoReplyPause.deleteMany({
      where: {
        pausedUntil: {
          lte: now,
        },
      },
    });

    return deleted;
  }

  // 获取需要定时发送的自动回复
  async getScheduledAutoReplies() {
    return this.prisma.autoReply.findMany({
      where: {
        isActive: true,
        triggerType: 'scheduled', // 新增定时触发类型
        // 移除 hasOptions: true 限制，允许没有可点击选项的定时回复
      },
      include: {
        formTemplate: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  // 发送定时自动回复
  async sendScheduledAutoReply(sessionId: string, autoReply: any) {
    try {
      // 检查是否已经发送过这个自动回复
      const existingMessage = await this.prisma.conversation.findFirst({
        where: {
          sessionId,
          sender: 'bot',
          metadata: {
            path: ['autoReplyId'],
            equals: autoReply.id,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 如果最近已经发送过（5分钟内），不重复发送
      if (existingMessage) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (existingMessage.createdAt > fiveMinutesAgo) {
          return null;
        }
      }

      // 创建机器人消息
      const botMessage = await this.prisma.conversation.create({
        data: {
          sessionId,
          sender: 'bot',
          message: autoReply.message,
          metadata: {
            autoReplyId: autoReply.id,
            hasOptions: autoReply.hasOptions,
            options: autoReply.options,
            formTemplateId: autoReply.formTemplateId,
            isScheduled: true,
          },
        },
      });

      return botMessage;
    } catch (error) {
      console.error('发送定时自动回复失败:', error);
      return null;
    }
  }

  // 获取下一个应该发送的自动回复
  async getNextScheduledReply(sessionId: string) {
    // 获取会话的表单数据
    const session = await this.prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return null;
    }

    const formData = (session.metadata as any)?.formData || {};
    
    // 获取所有定时自动回复，按优先级降序排列
    const scheduledReplies = await this.getScheduledAutoReplies();
    
    // 按优先级顺序找到下一个需要发送的回复
    for (const reply of scheduledReplies) {
      if (reply.options && Array.isArray(reply.options)) {
        // 检查这个回复对应的字段是否已经填写
        const firstOption = reply.options[0] as any;
        const fieldName = firstOption?.fieldName;
        
        // 如果字段已填写，跳过这个回复
        if (fieldName && formData[fieldName]) {
          continue;
        }
        
        // 检查是否已经发送过这个回复（检查整个会话历史）
        const existingMessage = await this.prisma.conversation.findFirst({
          where: {
            sessionId,
            sender: 'bot',
            metadata: {
              path: ['autoReplyId'],
              equals: reply.id,
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        // 如果已经发送过这个回复，跳过
        if (existingMessage) {
          continue;
        }
        
        // 如果从未发送过，返回这个回复
        return reply;
      } else {
        // 对于没有选项的回复（如电话询问），需要特殊处理
        // 检查是否已经收集到电话号码
        if (reply.message && reply.message.includes('号码') && formData.phone) {
          // 如果已经收集到电话号码，跳过这个回复
          continue;
        }
        
        // 检查是否已经发送过这个回复（检查整个会话历史）
        const existingMessage = await this.prisma.conversation.findFirst({
          where: {
            sessionId,
            sender: 'bot',
            metadata: {
              path: ['autoReplyId'],
              equals: reply.id,
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        // 如果已经发送过这个回复，跳过
        if (existingMessage) {
          continue;
        }
        
        // 如果从未发送过，返回这个回复
        return reply;
      }
    }

    return null;
  }

  // 检查选项点击是否匹配对应的消息
  async validateOptionClick(sessionId: string, option: any, messageId: string) {
    try {
      // 获取消息
      const message = await this.prisma.conversation.findUnique({
        where: { id: messageId },
      });

      if (!message || message.sessionId !== sessionId) {
        return false;
      }

      const metadata = message.metadata as any;
      if (!metadata || !metadata.options || !Array.isArray(metadata.options)) {
        return false;
      }

      // 检查选项是否存在于消息中
      const optionExists = metadata.options.some((msgOption: any) => 
        msgOption.label === option.label && 
        msgOption.fieldName === option.fieldName &&
        msgOption.fieldValue === option.fieldValue
      );

      return optionExists;
    } catch (error) {
      console.error('验证选项点击失败:', error);
      return false;
    }
  }
}

