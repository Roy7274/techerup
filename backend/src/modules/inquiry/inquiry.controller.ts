import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post()
  create(@Body() createInquiryDto: CreateInquiryDto) {
    return this.inquiryService.create(createInquiryDto);
  }

  @Get()
  findAll(
    @Request() req,
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

    return this.inquiryService.findAll(req.user, filters);
  }

  @Get('stats')
  getStats(@Request() req, @Query('city') city?: string) {
    return this.inquiryService.getStats(req.user, city);
  }

  @Get('trend')
  getTrendData(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'daily' | 'monthly' = 'daily',
    @Query('city') city?: string,
  ) {
    return this.inquiryService.getTrendData(req.user, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      groupBy,
      city,
    });
  }

  @Get('cities')
  async getCities(@Request() req) {
    try {
      const cities = await this.inquiryService.getCities(req.user);
      return cities;
    } catch (error) {
      console.error('获取城市列表失败:', error);
      return [];
    }
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.inquiryService.findOne(req.user, id);
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

