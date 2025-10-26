import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { BannerModule } from './modules/banner/banner.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArticleModule } from './modules/article/article.module';
import { ContentModuleModule } from './modules/content-module/content-module.module';
import { ContentCardModule } from './modules/content-card/content-card.module';
import { AutoReplyModule } from './modules/auto-reply/auto-reply.module';
import { FormTemplateModule } from './modules/form-template/form-template.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    InquiryModule,
    ConversationModule,
    BannerModule,
    MerchantModule,
    AuthModule,
    ArticleModule,
    ContentModuleModule,
    ContentCardModule,
    AutoReplyModule,
    FormTemplateModule,
    AdminModule,
    AiModule,
  ],
})
export class AppModule {}

