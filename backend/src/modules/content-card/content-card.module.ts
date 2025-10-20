import { Module } from '@nestjs/common';
import { ContentCardService } from './content-card.service';
import { ContentCardController } from './content-card.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentCardController],
  providers: [ContentCardService],
  exports: [ContentCardService],
})
export class ContentCardModule {}



