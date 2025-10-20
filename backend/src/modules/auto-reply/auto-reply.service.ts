import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';
import { UpdateAutoReplyDto } from './dto/update-auto-reply.dto';

@Injectable()
export class AutoReplyService {
  constructor(
    private prisma: PrismaService,
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

    // 匹配关键词触发的回复
    for (const reply of autoReplies) {
      if (reply.triggerType === 'keyword' && reply.keywords && reply.message && reply.message.trim()) {
        const keywords = Array.isArray(reply.keywords) 
          ? reply.keywords 
          : (reply.keywords as any)?.keywords || [];
        
        for (const keyword of keywords) {
          if (keyword && keyword.trim() && lowerMessage.includes(keyword.toLowerCase().trim())) {
            return reply;
          }
        }
      }
    }

    // 如果没有关键词匹配，返回默认回复
    const defaultReply = autoReplies.find(r => r.triggerType === 'default' && r.message && r.message.trim());
    return defaultReply || null;
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

