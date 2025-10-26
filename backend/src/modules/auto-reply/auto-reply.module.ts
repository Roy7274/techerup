import { Module, forwardRef } from '@nestjs/common';
import { AutoReplyService } from './auto-reply.service';
import { AutoReplyController } from './auto-reply.controller';
import { AutoReplySchedulerService } from './auto-reply-scheduler.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConversationModule } from '../conversation/conversation.module';
import { AiModule } from '../ai/ai.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ConversationModule),
    AiModule,
    MerchantModule,
  ],
  controllers: [AutoReplyController],
  providers: [AutoReplyService, AutoReplySchedulerService],
  exports: [AutoReplyService],
})
export class AutoReplyModule {}


