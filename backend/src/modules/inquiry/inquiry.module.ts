import { Module } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { InquiryService } from './inquiry.service';
import { CityFilterService } from '../admin/city-filter.service';
import { AdminService } from '../admin/admin.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InquiryController],
  providers: [InquiryService, CityFilterService, AdminService],
  exports: [InquiryService],
})
export class InquiryModule {}

