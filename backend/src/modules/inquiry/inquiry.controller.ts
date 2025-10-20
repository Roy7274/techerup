import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';

@Controller('inquiries')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post()
  create(@Body() createInquiryDto: CreateInquiryDto) {
    return this.inquiryService.create(createInquiryDto);
  }

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (city) filters.city = city;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.inquiryService.findAll(filters);
  }

  @Get('stats')
  getStats() {
    return this.inquiryService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inquiryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInquiryDto: UpdateInquiryDto) {
    return this.inquiryService.update(id, updateInquiryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inquiryService.remove(id);
  }
}

