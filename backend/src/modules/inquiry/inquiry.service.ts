import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(private prisma: PrismaService) {}

  // 创建咨询记录
  async create(createInquiryDto: CreateInquiryDto) {
    return this.prisma.inquiry.create({
      data: createInquiryDto,
    });
  }

  // 获取所有咨询记录（带筛选）
  async findAll(filters?: {
    city?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.inquiry.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        conversations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  // 获取单个咨询记录
  async findOne(id: string) {
    return this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  // 更新咨询记录
  async update(id: string, updateInquiryDto: UpdateInquiryDto) {
    return this.prisma.inquiry.update({
      where: { id },
      data: updateInquiryDto,
    });
  }

  // 删除咨询记录
  async remove(id: string) {
    return this.prisma.inquiry.delete({
      where: { id },
    });
  }

  // 统计数据
  async getStats() {
    const total = await this.prisma.inquiry.count();
    const contacted = await this.prisma.inquiry.count({
      where: { status: '已联系' },
    });
    const uncontacted = await this.prisma.inquiry.count({
      where: { status: '未联系' },
    });

    // 按城市统计
    const byCity = await this.prisma.inquiry.groupBy({
      by: ['city'],
      _count: true,
    });

    // 按学段统计
    const byGrade = await this.prisma.inquiry.groupBy({
      by: ['grade'],
      _count: true,
    });

    return {
      total,
      contacted,
      uncontacted,
      byCity,
      byGrade,
    };
  }
}

