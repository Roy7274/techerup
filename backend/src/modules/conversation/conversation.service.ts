import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationGateway } from './conversation.gateway';
import { AutoReplyService } from '../auto-reply/auto-reply.service';
import { GeoLocationService } from '../geo-location/geo-location.service';
import { MerchantService } from '../merchant/merchant.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ConversationService {
  private logger: Logger = new Logger('ConversationService');
  
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ConversationGateway))
    private conversationGateway: ConversationGateway,
    private autoReplyService: AutoReplyService,
    private geoLocationService: GeoLocationService,
    private merchantService: MerchantService,
  ) {}

  // 获取或创建会话
  async getOrCreateSession(sessionId: string, clientIP?: string, userAgent?: string, acceptLanguage?: string) {
    let session = await this.prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session) {
      // 仅初始化为“未知”，不再在会话创建时尝试通过IP/请求头定位
      const detectedCity = '未知';

      const sessionData = { 
        sessionId,
        metadata: {
          formData: {
            city: detectedCity
          },
          geoInfo: {
            detectedCity,
            clientIP,
            detectedAt: new Date().toISOString()
          }
        }
      };
      
      this.logger.log(`创建新会话 - 数据:`, JSON.stringify(sessionData, null, 2));
      
      session = await this.prisma.session.create({
        data: sessionData,
      });
      
      this.logger.log(`新会话 ${sessionId} 创建，检测到城市: ${detectedCity}`);
      
      // 新会话创建时，立即发送欢迎语
      await this.sendWelcomeMessageOnSessionCreate(sessionId);
      
      // 新会话创建时，通知客服有新会话可以监控
      this.conversationGateway.notifyAgents({
        sessionId,
        type: 'new-session',
        session,
      });
    }

    return session;
  }

  // 更新会话最后活跃时间
  async updateSessionActivity(sessionId: string) {
    await this.prisma.session.update({
      where: { sessionId },
      data: { lastActivity: new Date() },
    });
  }

  // 新会话创建时发送欢迎语
  async sendWelcomeMessageOnSessionCreate(sessionId: string) {
    try {
      const welcomeMessage = await this.autoReplyService.getWelcomeMessage();
      if (welcomeMessage && welcomeMessage.message && welcomeMessage.message.trim()) {
        // 创建欢迎语消息
        const botMessage = await this.prisma.conversation.create({
          data: {
            sessionId,
            sender: 'bot',
            message: welcomeMessage.message.trim(),
            metadata: {
              autoReplyId: welcomeMessage.id,
              hasOptions: welcomeMessage.hasOptions,
              options: welcomeMessage.options,
            },
          },
        });

        // 通知前端有新消息
        this.conversationGateway.broadcastMessage(sessionId, botMessage);
        
        this.logger.log(`新会话 ${sessionId} 已发送欢迎语: ${welcomeMessage.name}`);
      }
    } catch (error) {
      this.logger.error(`发送欢迎语失败:`, error);
    }
  }

  // 检查会话是否已转人工
  async isAgentSession(sessionId: string) {
    const session = await this.getOrCreateSession(sessionId);
    return session.isAgent;
  }

  // 创建对话消息
  async create(createConversationDto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: createConversationDto,
    });
  }

  // 发送自动回复消息
  async sendAutoReplyMessage(sessionId: string, autoReply: any) {
    try {
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
            isScheduled: autoReply.triggerType === 'scheduled',
          },
        },
      });
      
      this.logger.debug(`发送自动回复消息: ${autoReply.message}`);
      return botMessage;
    } catch (error) {
      this.logger.error('发送自动回复消息失败:', error);
      return null;
    }
  }

  // 获取会话的所有对话
  async findBySession(sessionId: string) {
    return this.prisma.conversation.findMany({
      where: { sessionId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // 获取咨询记录的所有对话（仅超级管理员可访问）
  async findByInquiry(inquiryId: string) {
    return this.prisma.conversation.findMany({
      where: { inquiryId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // 获取会话的表单数据
  async getSessionFormData(sessionId: string) {
    try {
      const session = await this.getOrCreateSession(sessionId);
      return (session.metadata as any)?.formData || {};
    } catch (error) {
      this.logger.error(`获取会话表单数据失败:`, error);
      return {};
    }
  }

  // 保存用户消息并获取自动回复
  async handleUserMessage(sessionId: string, message: string, metadata?: any, clientIP?: string, userAgent?: string, acceptLanguage?: string) {
    // 确保会话存在并更新活跃时间
    await this.getOrCreateSession(sessionId, clientIP, userAgent, acceptLanguage);
    await this.updateSessionActivity(sessionId);

    // 如果metadata包含地理信息，优先使用前端获取的地理信息
    if (metadata?.geoInfo?.city) {
      await this.saveSessionFormData(sessionId, 'city', metadata.geoInfo.city);
      this.logger.log(`使用前端地理信息: ${metadata.geoInfo.city} (会话: ${sessionId})`);
    }

    // 如果metadata包含字段信息，保存到会话的表单数据中
    if (metadata?.fromOption && metadata?.fieldName && metadata?.fieldValue) {
      await this.saveSessionFormData(sessionId, metadata.fieldName, metadata.fieldValue);
    }

    // 自动识别用户输入中的信息并保存到表单数据
    await this.autoExtractFormData(sessionId, message);

    // 保存用户消息
    const userMessage = await this.create({
      sessionId,
      sender: 'user',
      message,
      metadata,
    });

    // 广播用户消息（通知客服）
    this.conversationGateway.broadcastMessage(sessionId, userMessage);

    // 检查是否已转人工客服
    const isAgent = await this.isAgentSession(sessionId);
    
    // 通知所有客服有新消息（无论是否已转人工，都让客服能监控到）
    this.conversationGateway.notifyAgentsNewMessage({
      sessionId,
      type: 'new-user-message',
      message: userMessage,
      isAgent,
    });
    
    if (isAgent) {
      // 如果已转人工，不自动回复，等待人工客服回复
      return {
        reply: null,
        isAgent: true,
        message: '消息已发送，请等待客服回复',
      };
    }

    // 如果当前消息来自选项点击，验证选项匹配并发送下一个询问
    const isFromOption = metadata && (metadata as any).fromOption;
    if (isFromOption) {
      // 验证选项点击是否匹配对应的消息
      if (metadata.messageId) {
        const isValidOption = await this.autoReplyService.validateOptionClick(
          sessionId, 
          { 
            label: message, 
            fieldName: metadata.fieldName, 
            fieldValue: metadata.fieldValue 
          }, 
          metadata.messageId
        );
        
        if (!isValidOption) {
          this.logger.warn(`选项点击不匹配: 会话${sessionId}, 消息${metadata.messageId}`);
          return {
            reply: null,
            isAgent: false,
            message: null,
          };
        }
      }

      // 保存表单数据
      if (metadata.fieldName && metadata.fieldValue) {
        await this.saveSessionFormData(sessionId, metadata.fieldName, metadata.fieldValue);
      }

      // 获取下一个应该发送的自动回复
      const nextReply = await this.autoReplyService.getNextScheduledReply(sessionId);
      if (nextReply) {
        const botMessage = await this.autoReplyService.sendScheduledAutoReply(sessionId, nextReply);
        if (botMessage) {
          // 广播机器人回复
          this.conversationGateway.broadcastMessage(sessionId, botMessage);
          return {
            reply: botMessage.message,
            autoReply: nextReply,
            isAgent: false,
          };
        }
      }

      return {
        reply: null,
        isAgent: false,
        message: null,
      };
    }

    // 检查会话历史，决定是否需要自动回复
    const history = await this.findBySession(sessionId);
    
    // 检查是否已经有自动回复处理过（避免重复）
    // 只检查最近1条消息，避免过度限制AI回复
    const recentMessages = history.slice(-1);
    const lastMessage = recentMessages[0];
    
    // 如果最近一条消息是自动回复，检查是否需要避免重复
    if (lastMessage && lastMessage.sender === 'bot' && lastMessage.metadata && (lastMessage.metadata as any).autoReplyId) {
      const lastAutoReplyId = (lastMessage.metadata as any).autoReplyId;
      const lastAutoReply = await this.autoReplyService.findOne(lastAutoReplyId);
      
      // 如果最近一条是定时询问，允许AI回复
      // 如果最近一条是AI回复，允许定时询问
      // 只有相同类型的连续回复才需要避免
      if (lastAutoReply && lastAutoReply.triggerType === 'scheduled') {
        this.logger.log(`会话 ${sessionId} 最近一条是定时询问，允许AI回复`);
      } else if (lastAutoReply && (lastAutoReply.triggerType === 'default' || lastAutoReply.useAI)) {
        this.logger.log(`会话 ${sessionId} 最近一条是AI回复，允许定时询问`);
      } else {
        this.logger.log(`会话 ${sessionId} 最近一条是相同类型的自动回复，跳过重复发送`);
        return {
          reply: null,
          isAgent: false,
          message: null,
        };
      }
    }
    
    let autoReplyData = null;
    let botMessageText = '';
    
    // 检查是否已经有欢迎语消息
    let hasWelcomeMessage = false;
    for (const msg of history) {
      if (msg.sender === 'bot' && 
          msg.metadata && 
          (msg.metadata as any).autoReplyId) {
        const isWelcome = await this.autoReplyService.isWelcomeMessage((msg.metadata as any).autoReplyId);
        if (isWelcome) {
          hasWelcomeMessage = true;
          break;
        }
      }
    }

    // 如果没有欢迎语，先尝试发送欢迎语
    if (!hasWelcomeMessage) {
      this.logger.debug(`会话 ${sessionId} 没有欢迎语，尝试发送欢迎语`);
      const welcomeMessage = await this.autoReplyService.getWelcomeMessage();
      if (welcomeMessage && welcomeMessage.message && welcomeMessage.message.trim()) {
        this.logger.debug(`找到欢迎语: ${welcomeMessage.message}`);
        autoReplyData = welcomeMessage;
        botMessageText = welcomeMessage.message.trim();
      } else {
        this.logger.debug(`没有找到欢迎语，尝试获取定时回复`);
        // 如果没有设置欢迎语，获取第一个定时自动回复
        const firstScheduledReply = await this.autoReplyService.getNextScheduledReply(sessionId);
        if (firstScheduledReply) {
          this.logger.debug(`找到定时回复: ${firstScheduledReply.message}`);
          autoReplyData = firstScheduledReply;
          botMessageText = firstScheduledReply.message.trim();
        }
      }
    } else {
      // 先检查是否启用默认AI回复，如果启用则优先使用AI回复
      const merchantInfo = await this.merchantService.findActive();
      if (merchantInfo && merchantInfo.defaultAIEnabled) {
        // 检查用户消息是否像是一个问题（包含问号或疑问词）
        const isQuestion = /[？?]|什么|怎么|如何|为什么|哪里|哪个|多少|是否|有没有|可以吗|行吗|好吗/.test(message);
        
        if (isQuestion) {
          // 如果是问题，使用AI回复
          this.logger.debug(`用户发送了问题，使用AI回复: ${message}`);
          const defaultAiReply = await this.autoReplyService.generateDefaultAiReply(message, sessionId);
          if (defaultAiReply && defaultAiReply.message && defaultAiReply.message.trim()) {
            autoReplyData = defaultAiReply;
            botMessageText = defaultAiReply.message.trim();
          } else {
            // AI回复失败，回退到关键词匹配
            const matchedReply = await this.autoReplyService.findMatchingReply(message, sessionId);
            if (matchedReply && matchedReply.message && matchedReply.message.trim()) {
              autoReplyData = matchedReply;
              botMessageText = matchedReply.message.trim();
            }
          }
          
          // AI回复后，检查是否需要发送定时询问
          if (autoReplyData && botMessageText) {
            // 延迟发送定时询问，让用户先看到AI回复
            setTimeout(async () => {
              try {
                const nextScheduledReply = await this.autoReplyService.getNextScheduledReply(sessionId);
                if (nextScheduledReply) {
                  this.logger.debug(`AI回复后发送定时询问: ${nextScheduledReply.message}`);
                  await this.sendAutoReplyMessage(sessionId, nextScheduledReply);
                }
              } catch (error) {
                this.logger.error('AI回复后发送定时询问失败:', error);
              }
            }, 2000); // 2秒后发送定时询问
          }
        } else {
          // 如果不是问题，尝试匹配关键词或默认回复
          const matchedReply = await this.autoReplyService.findMatchingReply(message, sessionId);
          
          if (matchedReply && matchedReply.message && matchedReply.message.trim()) {
            autoReplyData = matchedReply;
            botMessageText = matchedReply.message.trim();
          } else {
            // 如果没有匹配的自动回复，获取下一个定时自动回复
            const nextScheduledReply = await this.autoReplyService.getNextScheduledReply(sessionId);
            if (nextScheduledReply) {
              autoReplyData = nextScheduledReply;
              botMessageText = nextScheduledReply.message.trim();
            }
          }
        }
      } else {
        // 如果没有启用默认AI回复，使用原来的逻辑
        const matchedReply = await this.autoReplyService.findMatchingReply(message, sessionId);
        
        if (matchedReply && matchedReply.message && matchedReply.message.trim()) {
          autoReplyData = matchedReply;
          botMessageText = matchedReply.message.trim();
        } else {
          // 如果没有匹配的自动回复，先尝试获取默认回复
          const defaultReply = await this.autoReplyService.getDefaultReply();
          if (defaultReply && defaultReply.message && defaultReply.message.trim()) {
            autoReplyData = defaultReply;
            botMessageText = defaultReply.message.trim();
          } else {
            // 如果没有默认回复，获取下一个定时自动回复
            const nextScheduledReply = await this.autoReplyService.getNextScheduledReply(sessionId);
            if (nextScheduledReply) {
              autoReplyData = nextScheduledReply;
              botMessageText = nextScheduledReply.message.trim();
            }
          }
        }
      }
    }

    // 验证消息内容，如果为空则不发送
    if (!botMessageText || !botMessageText.trim()) {
      this.logger.warn(`会话 ${sessionId} 自动回复消息为空，跳过发送`);
      this.logger.debug(`autoReplyData: ${JSON.stringify(autoReplyData)}`);
      this.logger.debug(`botMessageText: "${botMessageText}"`);
      return {
        reply: null,
        isAgent: false,
        message: null,
      };
    }
    
    this.logger.debug(`会话 ${sessionId} 准备发送自动回复: ${botMessageText}`);

    // 保存机器人回复
    const botMessage = await this.create({
      sessionId,
      sender: 'bot',
      message: botMessageText,
      metadata: autoReplyData ? { 
        autoReplyId: autoReplyData.id,
        hasOptions: autoReplyData.hasOptions,
        options: autoReplyData.options,
        formTemplateId: autoReplyData.formTemplateId,
      } : {
        // 即使没有autoReplyData，也标记为自动回复，避免重复
        autoReplyId: 'no-auto-reply',
        isLegacy: true,
      },
    });

    // 广播机器人回复
    this.conversationGateway.broadcastMessage(sessionId, botMessage);

    return {
      reply: botMessageText,
      autoReply: autoReplyData,
      isAgent: false,
    };
  }

  // 自动提取用户输入中的表单数据
  async autoExtractFormData(sessionId: string, message: string) {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const currentMetadata = session.metadata as any || {};
      const formData = currentMetadata.formData || {};
      
      let hasNewData = false;
      
      // 识别手机号码
      if (!formData.phone) {
        const phoneMatch = message.match(/1[3-9]\d{9}/);
        if (phoneMatch) {
          formData.phone = phoneMatch[0];
          hasNewData = true;
          this.logger.log(`自动识别并保存手机号码: ${phoneMatch[0]} (会话: ${sessionId})`);
        }
      }
      
      // 识别城市信息（只有在没有检测到地理信息时才进行文本识别）
      if (!formData.city) {
        const cityMatch = message.match(/(.{2,10})(市|城|区|县)/);
        if (cityMatch) {
          formData.city = cityMatch[0];
          hasNewData = true;
          this.logger.log(`自动识别并保存城市: ${cityMatch[0]} (会话: ${sessionId})`);
        }
      } else {
        // 如果已有城市信息，记录日志
        this.logger.log(`会话 ${sessionId} 已有城市信息: ${formData.city}，跳过文本识别`);
      }
      
      // 识别学段信息
      if (!formData.grade) {
        if (message.includes('小学')) {
          formData.grade = '小学';
          hasNewData = true;
        } else if (message.includes('初中')) {
          formData.grade = '初中';
          hasNewData = true;
        } else if (message.includes('高中')) {
          formData.grade = '高中';
          hasNewData = true;
        }
        if (hasNewData) {
          this.logger.log(`自动识别并保存学段: ${formData.grade} (会话: ${sessionId})`);
        }
      }
      
      // 识别性别信息
      if (!formData.studentGender) {
        if (message.includes('男孩') || message.includes('男')) {
          formData.studentGender = '男孩';
          hasNewData = true;
        } else if (message.includes('女孩') || message.includes('女')) {
          formData.studentGender = '女孩';
          hasNewData = true;
        }
        if (hasNewData) {
          this.logger.log(`自动识别并保存性别: ${formData.studentGender} (会话: ${sessionId})`);
        }
      }
      
      // 识别身份信息
      if (!formData.identity) {
        if (message.includes('本人') || message.includes('学生')) {
          formData.identity = '本人';
          hasNewData = true;
        } else if (message.includes('家长') || message.includes('父母')) {
          formData.identity = '家长';
          hasNewData = true;
        }
        if (hasNewData) {
          this.logger.log(`自动识别并保存身份: ${formData.identity} (会话: ${sessionId})`);
        }
      }
      
      // 如果有新数据，保存到数据库
      if (hasNewData) {
        await this.prisma.session.update({
          where: { sessionId },
          data: {
            metadata: {
              ...currentMetadata,
              formData
            }
          }
        });
      }
    } catch (error) {
      this.logger.error(`自动提取表单数据失败:`, error);
    }
  }

  // 保存会话的表单数据
  async saveSessionFormData(sessionId: string, fieldName: string, fieldValue: string) {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const currentMetadata = session.metadata as any || {};
      const formData = currentMetadata.formData || {};
      
      // 更新字段值
      formData[fieldName] = fieldValue;
      
      // 保存回session
      await this.prisma.session.update({
        where: { sessionId },
        data: {
          metadata: {
            ...currentMetadata,
            formData
          }
        }
      });
      
      this.logger.log(`保存表单字段: ${fieldName} = ${fieldValue} (会话: ${sessionId})`);
    } catch (error) {
      this.logger.error(`保存表单字段失败:`, error);
    }
  }

  // 切换到人工客服
  async switchToAgent(sessionId: string) {
    // 确保会话存在
    await this.getOrCreateSession(sessionId);
    
    // 更新会话状态为人工客服模式
    const session = await this.prisma.session.update({
      where: { sessionId },
      data: { 
        isAgent: true,
        updatedAt: new Date(),
      },
    });

    // 保存系统消息
    const systemMessage = await this.create({
      sessionId,
      sender: 'agent',
      message: '人工客服已接入，有什么可以帮您的吗？',
    });

    // 广播会话状态变更
    this.conversationGateway.broadcastSessionUpdate(sessionId, {
      isAgent: true,
      message: systemMessage,
    });

    // 通知所有客服有新会话
    this.conversationGateway.notifyAgents({
      sessionId,
      type: 'new-agent-session',
      session,
    });

    return {
      message: '已转接至人工客服',
      isAgent: true,
    };
  }

  // 人工客服发送消息
  async sendAgentMessage(sessionId: string, message: string, agentId?: string) {
    // 确保会话存在
    const session = await this.getOrCreateSession(sessionId);
    
    // 如果还未转人工，先标记为人工模式
    if (!session.isAgent) {
      await this.prisma.session.update({
        where: { sessionId },
        data: { isAgent: true, agentId },
      });
    }

    // 更新活跃时间
    await this.updateSessionActivity(sessionId);

    // 暂停自动回复2分钟（人工回复后）
    await this.autoReplyService.pauseAutoReply(sessionId, 2, 'agent_reply');

    // 保存人工客服消息
    const conversation = await this.create({
      sessionId,
      sender: 'agent',
      message,
      metadata: agentId ? { agentId } : undefined,
    });

    // 广播客服消息（通知用户）
    this.conversationGateway.broadcastMessage(sessionId, conversation);

    return conversation;
  }

  // 获取会话状态
  async getSessionStatus(sessionId: string) {
    const session = await this.getOrCreateSession(sessionId);
    return {
      sessionId: session.sessionId,
      isAgent: session.isAgent,
      agentId: session.agentId,
      lastActivity: session.lastActivity,
    };
  }

  // 获取所有活跃会话（用于客服后台）
  async getActiveSessions(limit: number = 50, currentUser?: any) {
    // 获取最近活跃的会话（24小时内）
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let whereClause: any = {
      lastActivity: {
        gte: oneDayAgo,
      },
    };

    // 如果不是超级管理员，需要根据城市权限过滤
    if (currentUser && currentUser.role !== 'super_admin') {
      // 这里需要根据会话的城市信息进行过滤
      // 由于会话表没有直接的城市字段，我们需要通过关联的咨询记录来过滤
      // 暂时返回所有会话，后续可以通过关联查询优化
    }
    
    const sessions = await this.prisma.session.findMany({
      where: whereClause,
      orderBy: {
        lastActivity: 'desc',
      },
      take: limit,
    });

    // 为每个会话获取最后一条消息
    const sessionsWithLastMessage = await Promise.all(
      sessions.map(async (session) => {
        const lastMessage = await this.prisma.conversation.findFirst({
          where: { sessionId: session.sessionId },
          orderBy: { createdAt: 'desc' },
        });

        // 统计未读消息数
        const lastAgentMessage = await this.prisma.conversation.findFirst({
          where: { 
            sessionId: session.sessionId,
            sender: 'agent',
          },
          orderBy: { createdAt: 'desc' },
        });

        let unreadCount = 0;
        if (lastAgentMessage) {
          // 如果客服已回复过，统计客服最后一条消息之后的用户消息
          unreadCount = await this.prisma.conversation.count({
            where: {
              sessionId: session.sessionId,
              sender: 'user',
              createdAt: {
                gt: lastAgentMessage.createdAt,
              },
            },
          });
        } else if (session.isAgent) {
          // 如果已转人工但客服还没回复，统计所有用户消息
          unreadCount = await this.prisma.conversation.count({
            where: {
              sessionId: session.sessionId,
              sender: 'user',
            },
          });
        } else {
          // 如果还未转人工，统计所有用户消息（客服可以随时介入）
          unreadCount = await this.prisma.conversation.count({
            where: {
              sessionId: session.sessionId,
              sender: 'user',
            },
          });
        }

        return {
          ...session,
          lastMessage: lastMessage?.message || '',
          lastMessageTime: lastMessage?.createdAt || session.lastActivity,
          unreadCount,
          canIntervene: !session.isAgent, // 标记是否可以介入
        };
      })
    );

    return sessionsWithLastMessage;
  }

  // 获取需要人工处理的会话（所有活跃会话，包括未转人工的）
  async getPendingAgentSessions(currentUser?: any) {
    // 获取最近活跃的会话（24小时内）
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let whereClause: any = {
      lastActivity: {
        gte: oneDayAgo,
      },
    };

    // 如果不是超级管理员，需要根据城市权限过滤
    if (currentUser && currentUser.role !== 'super_admin') {
      // 这里需要根据会话的城市信息进行过滤
      // 由于会话表没有直接的城市字段，我们需要通过关联的咨询记录来过滤
      // 暂时返回所有会话，后续可以通过关联查询优化
    }
    
    const sessions = await this.prisma.session.findMany({
      where: whereClause,
      orderBy: {
        lastActivity: 'desc',
      },
    });

    const pendingSessions = [];
    
    for (const session of sessions) {
      // 获取最后一条消息
      const lastMessage = await this.prisma.conversation.findFirst({
        where: { sessionId: session.sessionId },
        orderBy: { createdAt: 'desc' },
      });

      // 统计未读消息
      const lastAgentMessage = await this.prisma.conversation.findFirst({
        where: { 
          sessionId: session.sessionId,
          sender: 'agent',
        },
        orderBy: { createdAt: 'desc' },
      });

      let unreadCount = 0;
      if (lastAgentMessage) {
        // 如果客服已回复过，统计客服最后一条消息之后的用户消息
        unreadCount = await this.prisma.conversation.count({
          where: {
            sessionId: session.sessionId,
            sender: 'user',
            createdAt: {
              gt: lastAgentMessage.createdAt,
            },
          },
        });
      } else {
        // 如果客服还没回复过，统计所有用户消息
        unreadCount = await this.prisma.conversation.count({
          where: {
            sessionId: session.sessionId,
            sender: 'user',
          },
        });
      }

      // 显示所有活跃会话（不管是否已转人工）
      pendingSessions.push({
        ...session,
        lastMessage: lastMessage?.message || '',
        lastMessageTime: lastMessage?.createdAt || session.lastActivity,
        unreadCount,
        needsReply: lastMessage?.sender === 'user', // 最后一条是用户消息才标记为需要回复
        canIntervene: !session.isAgent, // 标记是否可以介入
        status: session.isAgent ? 'agent' : 'auto', // 标记会话状态
      });
    }

    return pendingSessions;
  }

  // 从会话对话中提取用户信息并创建Inquiry记录
  async createInquiryFromSession(sessionId: string) {
    const conversations = await this.findBySession(sessionId);
    const session = await this.getOrCreateSession(sessionId);
    
    this.logger.log(`创建咨询记录 - 会话 ${sessionId} 的完整元数据:`, JSON.stringify(session.metadata, null, 2));
    
    // 优先从session的formData中获取信息
    const formData = (session.metadata as any)?.formData || {};
    
    this.logger.log(`创建咨询记录 - 会话 ${sessionId} 的表单数据:`, JSON.stringify(formData, null, 2));
    
    // 提取信息
    let city = formData.city || '';
    let grade = formData.grade || '';
    let studentGender = formData.studentGender || '';
    let identity = formData.identity || '';
    let phone = formData.phone || '';
    
    this.logger.log(`创建咨询记录 - 提取的城市信息: ${city}`);
    
    // 如果formData中没有，从对话中提取
    for (const conv of conversations) {
      const msg = conv.message;
      
      // 城市信息
      if (!city && conv.sender === 'user') {
        // 简单匹配城市（可以改进为更智能的匹配）
        const cityMatch = msg.match(/(.{2,10})(市|城)/);
        if (cityMatch) {
          city = msg.trim();
        }
      }
      
      // 学段信息
      if (!grade) {
        if (msg.includes('小学')) grade = '小学';
        else if (msg.includes('初中')) grade = '初中';
        else if (msg.includes('高中')) grade = '高中';
      }
      
      // 性别信息
      if (!studentGender) {
        if (msg.includes('男孩')) studentGender = '男孩';
        else if (msg.includes('女孩')) studentGender = '女孩';
      }
      
      // 身份信息
      if (!identity) {
        if (msg.includes('本人')) identity = '本人';
        else if (msg.includes('家长')) identity = '家长';
      }
      
      // 电话号码
      if (!phone) {
        const phoneMatch = msg.match(/1[3-9]\d{9}/);
        if (phoneMatch) {
          phone = phoneMatch[0];
        }
      }
    }
    
    // 如果有对话记录，就创建Inquiry记录（即使信息不完整）
    if (conversations.length > 0) {
      try {
        const inquiryData = {
          city: city || '未知',
          grade: grade || '未知',
          studentGender: studentGender || '未知',
          identity: identity || '未知',
          phone: phone || `会话-${sessionId.slice(-8)}`, // 如果没有电话，使用会话ID后8位
          status: phone ? '未联系' : '信息不完整',
        };
        
        this.logger.log(`创建咨询记录 - 最终数据:`, JSON.stringify(inquiryData, null, 2));
        
        const inquiry = await this.prisma.inquiry.create({
          data: inquiryData,
        });
        
        // 将该会话的所有对话关联到Inquiry
        await this.prisma.conversation.updateMany({
          where: { sessionId },
          data: { inquiryId: inquiry.id },
        });
        
        this.logger.log(`会话 ${sessionId} 的对话记录已关联到咨询记录 ${inquiry.id} (电话: ${phone || '未提供'})`);
        
        return inquiry;
      } catch (error) {
        this.logger.error(`创建咨询记录失败:`, error);
        return null;
      }
    }
    
    this.logger.warn(`会话 ${sessionId} 没有对话记录，跳过创建Inquiry`);
    return null;
  }

  // 用户离开会话时的处理
  async handleUserLeaveSession(sessionId: string) {
    try {
      // 暂停自动回复（用户离开后）
      await this.autoReplyService.pauseAutoReply(sessionId, 60, 'user_left');
      
      // 创建系统消息
      const systemMessage = await this.create({
        sessionId,
        sender: 'bot',
        message: '[系统消息] 用户已离开会话',
      });
      
      // 广播系统消息
      this.conversationGateway.broadcastMessage(sessionId, systemMessage);
      
      // 尝试从会话中创建Inquiry记录
      await this.createInquiryFromSession(sessionId);
      
      this.logger.log(`用户离开会话: ${sessionId}`);
    } catch (error) {
      this.logger.error(`处理用户离开会话失败:`, error);
    }
  }

  // 手动创建咨询记录（用于用户主动提交表单）
  async createInquiryFromFormData(sessionId: string, formData: any) {
    try {
      const inquiry = await this.prisma.inquiry.create({
        data: {
          city: formData.city || '未知',
          grade: formData.grade || '未知',
          studentGender: formData.studentGender || '未知',
          identity: formData.identity || '未知',
          phone: formData.phone || `表单-${sessionId.slice(-8)}`,
          status: formData.phone ? '未联系' : '信息不完整',
          formData: formData, // 保存完整的表单数据
        },
      });
      
      // 将该会话的所有对话关联到Inquiry
      await this.prisma.conversation.updateMany({
        where: { sessionId },
        data: { inquiryId: inquiry.id },
      });
      
      this.logger.log(`表单提交创建咨询记录: ${inquiry.id} (会话: ${sessionId})`);
      return inquiry;
    } catch (error) {
      this.logger.error(`创建咨询记录失败:`, error);
      throw error;
    }
  }

  // 归档会话（保存聊天记录并创建咨询记录）
  async archiveSession(sessionId: string) {
    try {
      // 先尝试创建Inquiry记录（如果还没有）
      const conversations = await this.findBySession(sessionId);
      const hasInquiry = conversations.some(conv => conv.inquiryId);
      
      if (!hasInquiry) {
        await this.createInquiryFromSession(sessionId);
      }
      
      // 删除会话记录（但保留对话记录，因为已关联到Inquiry）
      await this.prisma.session.delete({
        where: { sessionId },
      });
      
      this.logger.log(`会话 ${sessionId} 已归档`);
      return { success: true, message: '会话已归档' };
    } catch (error) {
      this.logger.error(`归档会话失败:`, error);
      throw error;
    }
  }

  // 真正删除会话（移除无效聊天，不保存任何记录）
  async deleteSession(sessionId: string) {
    try {
      // 直接删除会话和所有相关的对话记录
      await this.prisma.conversation.deleteMany({
        where: { sessionId },
      });
      
      await this.prisma.session.delete({
        where: { sessionId },
      });
      
      this.logger.log(`会话 ${sessionId} 已删除`);
      return { success: true, message: '会话已删除' };
    } catch (error) {
      this.logger.error(`删除会话失败:`, error);
      throw error;
    }
  }
}

