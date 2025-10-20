import { Module, forwardRef } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConversationGateway } from './conversation.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { AutoReplyModule } from '../auto-reply/auto-reply.module';
import { GeoLocationModule } from '../geo-location/geo-location.module';

@Module({
  imports: [PrismaModule, AutoReplyModule, GeoLocationModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationGateway],
  exports: [ConversationService, ConversationGateway],
})
export class ConversationModule {}

