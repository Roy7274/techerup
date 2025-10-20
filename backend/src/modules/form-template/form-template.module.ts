import { Module } from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { FormTemplateController } from './form-template.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormTemplateController],
  providers: [FormTemplateService],
  exports: [FormTemplateService],
})
export class FormTemplateModule {}


