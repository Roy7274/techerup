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
    const updateData: any = { ...updateInquiryDto };
    
    // 如果状态更新为"已联系"，同时更新联系时间
    if (updateInquiryDto.status === '已联系') {
      updateData.contactTime = new Date();
    }
    // 如果状态更新为"未联系"，清空联系时间
    else if (updateInquiryDto.status === '未联系') {
      updateData.contactTime = null;
    }
    
    return this.prisma.inquiry.update({
      where: { id },
      data: updateData,
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

    // 今日新增统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayNew = await this.prisma.inquiry.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 今日已联系统计
    const todayContacted = await this.prisma.inquiry.count({
      where: {
        status: '已联系',
        contactTime: {
          gte: today,
          lt: tomorrow,
        },
      },
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
      todayNew,
      todayContacted,
      byCity,
      byGrade,
    };
  }

  // 获取趋势数据
  async getTrendData(params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'daily' | 'monthly';
  }) {
    const { startDate, endDate, groupBy } = params;
    
    // 设置时间范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 包含结束日期的整天

    // 根据分组类型设置日期格式
    const dateFormat = groupBy === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD';
    
    try {
      // 获取咨询表趋势数据
      const inquiryTrend = await this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", ${dateFormat}) as date,
          COUNT(*) as inquiries,
          COUNT(CASE WHEN status = '已联系' THEN 1 END) as contacted
        FROM inquiries 
        WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
        GROUP BY TO_CHAR("createdAt", ${dateFormat})
        ORDER BY date
      `;

      // 获取聊天开始趋势数据（用户发送的第一条消息）
      const chatTrend = await this.prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", ${dateFormat}) as date,
          COUNT(DISTINCT "sessionId") as chat_started
        FROM conversations 
        WHERE sender = 'user' 
          AND "createdAt" >= ${start} 
          AND "createdAt" <= ${end}
        GROUP BY TO_CHAR("createdAt", ${dateFormat})
        ORDER BY date
      `;

      // 合并数据
      const trendMap = new Map();
      
      // 处理咨询数据
      (inquiryTrend as any[]).forEach((item: any) => {
        trendMap.set(item.date, {
          date: item.date,
          inquiries: parseInt(item.inquiries) || 0,
          contacted: parseInt(item.contacted) || 0,
          chatStarted: 0,
        });
      });

      // 处理聊天数据
      (chatTrend as any[]).forEach((item: any) => {
        const existing = trendMap.get(item.date) || {
          date: item.date,
          inquiries: 0,
          contacted: 0,
          chatStarted: 0,
        };
        existing.chatStarted = parseInt(item.chat_started) || 0;
        trendMap.set(item.date, existing);
      });

      // 转换为数组并排序
      const result = Array.from(trendMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      return result;
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      // 如果SQL查询失败，使用Prisma查询作为备选方案
      return this.getTrendDataFallback(params);
    }
  }

  // 备选方案：使用Prisma查询获取趋势数据
  private async getTrendDataFallback(params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'daily' | 'monthly';
  }) {
    const { startDate, endDate, groupBy } = params;
    
    // 设置时间范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 获取咨询数据
    const inquiries = await this.prisma.inquiry.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // 获取对话数据
    const conversations = await this.prisma.conversation.findMany({
      where: {
        sender: 'user',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
        sessionId: true,
      },
    });

    // 按日期分组统计
    const trendMap = new Map();

    // 处理咨询数据
    inquiries.forEach((inquiry) => {
      const date = groupBy === 'monthly' 
        ? inquiry.createdAt.toISOString().substring(0, 7) // YYYY-MM
        : inquiry.createdAt.toISOString().substring(0, 10); // YYYY-MM-DD
      
      if (!trendMap.has(date)) {
        trendMap.set(date, {
          date,
          inquiries: 0,
          contacted: 0,
          chatStarted: 0,
        });
      }
      
      const item = trendMap.get(date);
      item.inquiries++;
      if (inquiry.status === '已联系') {
        item.contacted++;
      }
    });

    // 处理对话数据
    const uniqueSessions = new Set();
    conversations.forEach((conversation) => {
      const date = groupBy === 'monthly' 
        ? conversation.createdAt.toISOString().substring(0, 7) // YYYY-MM
        : conversation.createdAt.toISOString().substring(0, 10); // YYYY-MM-DD
      
      if (!trendMap.has(date)) {
        trendMap.set(date, {
          date,
          inquiries: 0,
          contacted: 0,
          chatStarted: 0,
        });
      }
      
      const sessionKey = `${date}-${conversation.sessionId}`;
      if (!uniqueSessions.has(sessionKey)) {
        uniqueSessions.add(sessionKey);
        const item = trendMap.get(date);
        item.chatStarted++;
      }
    });

    // 转换为数组并排序
    const result = Array.from(trendMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    return result;
  }
}

