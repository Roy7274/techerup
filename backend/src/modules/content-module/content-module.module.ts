import { Module } from '@nestjs/common';
import { ContentModuleService } from './content-module.service';
import { ContentModuleController } from './content-module.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentModuleController],
  providers: [ContentModuleService],
  exports: [ContentModuleService],
})
export class ContentModuleModule {}



