import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoReplyService } from './auto-reply.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationGateway } from '../conversation/conversation.gateway';

@Injectable()
export class AutoReplySchedulerService {
  private readonly logger = new Logger(AutoReplySchedulerService.name);

  constructor(
    private autoReplyService: AutoReplyService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => ConversationGateway))
    private conversationGateway: ConversationGateway,
  ) {}

  // 每10秒检查一次需要发送自动回复的会话
  @Cron('*/10 * * * * *')
  async handleScheduledAutoReplies() {
    try {
      this.logger.log('开始检查定时自动回复...');
      
      // 获取所有活跃的会话（最近24小时内有活动）
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeSessions = await this.prisma.session.findMany({
        where: {
          lastActivity: {
            gte: oneDayAgo,
          },
          isAgent: false, // 只处理未转人工的会话
        },
        orderBy: {
          lastActivity: 'desc',
        },
        take: 100, // 限制处理数量，避免性能问题
      });

      // 基于内存过滤：排除已标记为定时不活跃的会话
      const candidates = activeSessions.filter(s => !((s.metadata as any)?.scheduledCheck?.inactive === true));

      this.logger.log(`找到 ${candidates.length} 个可检查会话`);

      for (const session of candidates) {
        try {
          await this.processSessionAutoReply(session.sessionId);
        } catch (error) {
          this.logger.error(`处理会话 ${session.sessionId} 的自动回复失败:`, error);
        }
      }

      this.logger.log('定时自动回复检查完成');
    } catch (error) {
      this.logger.error('定时自动回复任务执行失败:', error);
    }
  }

  // 处理单个会话的自动回复
  private async processSessionAutoReply(sessionId: string) {
    try {
      // 空闲超过30分钟则停止定时检查
      const session = await this.prisma.session.findUnique({ where: { sessionId } });
      if (!session) return;
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (session.lastActivity && session.lastActivity < thirtyMinutesAgo) {
        await this.autoReplyService.markSessionScheduledInactive(sessionId, 'idle_30m');
        this.logger.log(`会话 ${sessionId} 超过30分钟无活动，停止定时检查`);
        return;
      }

      // 如果会话被标记为定时检查不活跃，直接跳过
      const isScheduledInactive = await this.autoReplyService.isSessionScheduledInactive(sessionId);
      if (isScheduledInactive) {
        return;
      }

      // 检查自动回复是否被暂停
      const isPaused = await this.autoReplyService.isAutoReplyPaused(sessionId);
      if (isPaused) {
        return;
      }

      // 检查是否有人工客服最近回复过（暂停定时询问）
      const recentAgentMessage = await this.prisma.conversation.findFirst({
        where: { 
          sessionId,
          sender: 'agent',
          createdAt: {
            gte: new Date(Date.now() - 3 * 60 * 1000) // 3分钟内有客服回复
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentAgentMessage) {
        this.logger.log(`会话 ${sessionId} 最近有客服回复，暂停定时询问`);
        return;
      }

      // 获取下一个应该发送的自动回复
      const nextReply = await this.autoReplyService.getNextScheduledReply(sessionId);
      if (nextReply) {
        // 检查是否已经发送过这个回复（避免重复发送）
        const existingMessage = await this.prisma.conversation.findFirst({
          where: {
            sessionId,
            sender: 'bot',
            metadata: {
              path: ['autoReplyId'],
              equals: nextReply.id,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        // 如果已经发送过这个回复，跳过（检查整个会话历史）
        if (existingMessage) {
          this.logger.log(`会话 ${sessionId} 已经发送过自动回复 ${nextReply.name}，跳过重复发送`);
          return;
        }

        // 发送自动回复
        const botMessage = await this.autoReplyService.sendScheduledAutoReply(sessionId, nextReply);
        if (botMessage) {
          this.logger.log(`已发送定时自动回复到会话 ${sessionId}: ${nextReply.name}`);
          
          // 通知前端有新消息
          this.conversationGateway.broadcastMessage(sessionId, botMessage);
        }
      } else {
        // 没有下一个定时询问，标记为不活跃，停止后续检查
        await this.autoReplyService.markSessionScheduledInactive(sessionId, 'all_scheduled_sent');
        this.logger.log(`会话 ${sessionId} 所有定时询问已发送完，停止定时检查`);
        return;
      }
    } catch (error) {
      this.logger.error(`处理会话 ${sessionId} 自动回复失败:`, error);
    }
  }

  // 清理过期的暂停记录
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredPauses() {
    try {
      const deleted = await this.autoReplyService.cleanupExpiredPauses();
      if (deleted.count > 0) {
        this.logger.log(`清理了 ${deleted.count} 个过期的自动回复暂停记录`);
      }
    } catch (error) {
      this.logger.error('清理过期暂停记录失败:', error);
    }
  }
}
