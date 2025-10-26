import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { CityFilterService } from '../admin/city-filter.service';

@Injectable()
export class InquiryService {
  constructor(
    private prisma: PrismaService,
    private cityFilterService: CityFilterService,
  ) {}

  // 创建咨询记录
  async create(createInquiryDto: CreateInquiryDto) {
    return this.prisma.inquiry.create({
      data: createInquiryDto,
    });
  }

  // 获取所有咨询记录（带筛选）
  async findAll(currentUser: any, filters?: {
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

    // 添加城市过滤
    const filteredWhere = await this.cityFilterService.addCityFilter(currentUser, where);

    return this.prisma.inquiry.findMany({
      where: filteredWhere,
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
  async findOne(currentUser: any, id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!inquiry) {
      return null;
    }

    // 检查用户是否有权限访问该咨询记录
    const canAccess = await this.cityFilterService.canAccessCity(currentUser, inquiry.city);
    if (!canAccess) {
      return null;
    }

    return inquiry;
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
  async getStats(currentUser: any, city?: string) {
    
    // 构建基础查询条件
    let baseWhere: any = {};
    
    if (city) {
      // 检查用户是否有权限访问指定城市
      const canAccess = await this.cityFilterService.canAccessCity(currentUser, city);
      if (!canAccess) {
        return {
          total: 0,
          contacted: 0,
          uncontacted: 0,
          todayNew: 0,
          todayContacted: 0,
          byCity: [],
          byGrade: []
        };
      }
      baseWhere.city = city;
    } else {
      // 应用用户的城市权限过滤
      baseWhere = await this.cityFilterService.addCityFilter(currentUser, {});
    }
    
    
    const total = await this.prisma.inquiry.count({ where: baseWhere });
    const contacted = await this.prisma.inquiry.count({
      where: { ...baseWhere, status: '已联系' },
    });
    const uncontacted = await this.prisma.inquiry.count({
      where: { ...baseWhere, status: '未联系' },
    });

    // 今日新增统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayNew = await this.prisma.inquiry.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 今日已联系统计
    const todayContacted = await this.prisma.inquiry.count({
      where: {
        ...baseWhere,
        status: '已联系',
        contactTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 按城市统计 - 使用PostgreSQL优化的查询
    const byCity = await this.prisma.inquiry.groupBy({
      by: ['city'],
      where: baseWhere,
      _count: {
        city: true,
      },
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
    });

    // 按学段统计 - 使用PostgreSQL优化的查询
    const byGrade = await this.prisma.inquiry.groupBy({
      by: ['grade'],
      where: baseWhere,
      _count: {
        grade: true,
      },
      orderBy: {
        _count: {
          grade: 'desc',
        },
      },
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
  async getTrendData(currentUser: any, params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'daily' | 'monthly';
    city?: string;
  }) {
    const { startDate, endDate, groupBy, city } = params;
    
    // 设置时间范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 包含结束日期的整天

    // 根据分组类型设置日期格式
    const dateFormat = groupBy === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD';
    
    try {
      let inquiryTrend, chatTrend;
      
      if (city) {
        // 检查用户是否有权限访问指定城市
        const canAccess = await this.cityFilterService.canAccessCity(currentUser, city);
        if (!canAccess) {
          return [];
        }
        
        // 获取咨询表趋势数据 - 指定城市，使用PostgreSQL优化的查询
        const inquiryData = await this.prisma.inquiry.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            city: city,
          },
          select: {
            createdAt: true,
            status: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // 处理咨询数据
        const inquiryMap = new Map();
        inquiryData.forEach(inquiry => {
          const date = inquiry.createdAt.toISOString().split('T')[0];
          if (groupBy === 'monthly') {
            const monthKey = date.substring(0, 7); // YYYY-MM
            if (!inquiryMap.has(monthKey)) {
              inquiryMap.set(monthKey, { inquiries: 0, contacted: 0 });
            }
            const dayData = inquiryMap.get(monthKey);
            dayData.inquiries++;
            if (inquiry.status === '已联系') {
              dayData.contacted++;
            }
          } else {
            if (!inquiryMap.has(date)) {
              inquiryMap.set(date, { inquiries: 0, contacted: 0 });
            }
            const dayData = inquiryMap.get(date);
            dayData.inquiries++;
            if (inquiry.status === '已联系') {
              dayData.contacted++;
            }
          }
        });

        inquiryTrend = Array.from(inquiryMap.entries()).map(([date, data]) => ({
          date,
          inquiries: data.inquiries,
          contacted: data.contacted,
        }));

        // 获取聊天开始趋势数据 - 指定城市，使用PostgreSQL优化的查询
        const chatData = await this.prisma.conversation.findMany({
          where: {
            sender: 'user',
            createdAt: {
              gte: start,
              lte: end,
            },
            inquiry: {
              city: city,
            },
          },
          select: {
            createdAt: true,
            sessionId: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // 处理聊天数据
        const chatMap = new Map();
        const sessionDates = new Map(); // 记录每个sessionId的第一次聊天时间
        
        chatData.forEach(chat => {
          const sessionId = chat.sessionId;
          const date = chat.createdAt.toISOString().split('T')[0];
          
          if (groupBy === 'monthly') {
            const monthKey = date.substring(0, 7); // YYYY-MM
            if (!sessionDates.has(sessionId)) {
              sessionDates.set(sessionId, monthKey);
            }
          } else {
            if (!sessionDates.has(sessionId)) {
              sessionDates.set(sessionId, date);
            }
          }
        });

        // 统计每个日期的聊天开始数
        sessionDates.forEach((date) => {
          if (!chatMap.has(date)) {
            chatMap.set(date, 0);
          }
          chatMap.set(date, chatMap.get(date) + 1);
        });

        chatTrend = Array.from(chatMap.entries()).map(([date, count]) => ({
          date,
          chat_started: count,
        }));
      } else {
        // 根据用户角色决定查询范围
        let baseWhere;
        
        if (currentUser.role === 'super_admin') {
          // 超级管理员查看所有城市的数据
          baseWhere = {
            createdAt: {
              gte: start,
              lte: end,
            },
          };
        } else {
          // 普通管理员只能查看自己管理的城市
          const manageableCities = await this.cityFilterService.getAccessibleCities(currentUser);
          if (manageableCities.length === 0) {
            return [];
          }
          
          baseWhere = {
            createdAt: {
              gte: start,
              lte: end,
            },
            city: {
              in: manageableCities,
            },
          };
        }

        // 获取咨询表趋势数据 - 使用PostgreSQL优化的查询
        const inquiryData = await this.prisma.inquiry.findMany({
          where: baseWhere,
          select: {
            createdAt: true,
            status: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // 处理咨询数据
        const inquiryMap = new Map();
        inquiryData.forEach(inquiry => {
          const date = inquiry.createdAt.toISOString().split('T')[0];
          if (groupBy === 'monthly') {
            const monthKey = date.substring(0, 7); // YYYY-MM
            if (!inquiryMap.has(monthKey)) {
              inquiryMap.set(monthKey, { inquiries: 0, contacted: 0 });
            }
            const dayData = inquiryMap.get(monthKey);
            dayData.inquiries++;
            if (inquiry.status === '已联系') {
              dayData.contacted++;
            }
          } else {
            if (!inquiryMap.has(date)) {
              inquiryMap.set(date, { inquiries: 0, contacted: 0 });
            }
            const dayData = inquiryMap.get(date);
            dayData.inquiries++;
            if (inquiry.status === '已联系') {
              dayData.contacted++;
            }
          }
        });

        inquiryTrend = Array.from(inquiryMap.entries()).map(([date, data]) => ({
          date,
          inquiries: data.inquiries,
          contacted: data.contacted,
        }));

        // 获取聊天开始趋势数据 - 使用Prisma查询
        let chatWhere;
        
        if (currentUser.role === 'super_admin') {
          // 超级管理员查看所有城市的聊天数据
          chatWhere = {
            sender: 'user',
            createdAt: {
              gte: start,
              lte: end,
            },
          };
        } else {
          // 普通管理员只能查看自己管理的城市的聊天数据
          const manageableCities = await this.cityFilterService.getAccessibleCities(currentUser);
          chatWhere = {
            sender: 'user',
            createdAt: {
              gte: start,
              lte: end,
            },
            inquiry: {
              city: {
                in: manageableCities,
              },
            },
          };
        }
        
        const chatData = await this.prisma.conversation.findMany({
          where: chatWhere,
          select: {
            createdAt: true,
            sessionId: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // 处理聊天数据
        const chatMap = new Map();
        const sessionDates = new Map(); // 记录每个sessionId的第一次聊天时间
        
        chatData.forEach(chat => {
          const sessionId = chat.sessionId;
          const date = chat.createdAt.toISOString().split('T')[0];
          
          if (groupBy === 'monthly') {
            const monthKey = date.substring(0, 7); // YYYY-MM
            if (!sessionDates.has(sessionId)) {
              sessionDates.set(sessionId, monthKey);
            }
          } else {
            if (!sessionDates.has(sessionId)) {
              sessionDates.set(sessionId, date);
            }
          }
        });

        // 统计每个日期的聊天开始数
        sessionDates.forEach((date) => {
          if (!chatMap.has(date)) {
            chatMap.set(date, 0);
          }
          chatMap.set(date, chatMap.get(date) + 1);
        });

        chatTrend = Array.from(chatMap.entries()).map(([date, count]) => ({
          date,
          chat_started: count,
        }));
      }

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
      return this.getTrendDataFallback(currentUser, params);
    }
  }

  // 备选方案：使用Prisma查询获取趋势数据
  private async getTrendDataFallback(currentUser: any, params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'daily' | 'monthly';
    city?: string;
  }) {
    const { startDate, endDate, groupBy, city } = params;
    
    // 设置时间范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 构建城市筛选条件
    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (city) {
      // 检查用户是否有权限访问指定城市
      const canAccess = await this.cityFilterService.canAccessCity(currentUser, city);
      if (!canAccess) {
        return [];
      }
      whereClause.city = city;
    } else {
      // 应用用户的城市权限过滤
      const manageableCities = await this.cityFilterService.getAccessibleCities(currentUser);
      if (manageableCities.length === 0) {
        return [];
      }
      whereClause.city = { in: manageableCities };
    }

    // 获取咨询数据 - 使用PostgreSQL优化的查询
    const inquiries = await this.prisma.inquiry.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 获取对话数据（需要关联inquiry来获取城市信息）- 使用PostgreSQL优化的查询
    const conversations = await this.prisma.conversation.findMany({
      where: {
        sender: 'user',
        createdAt: {
          gte: start,
          lte: end,
        },
        inquiry: city ? { city } : { city: { in: await this.cityFilterService.getAccessibleCities(currentUser) } },
      },
      select: {
        createdAt: true,
        sessionId: true,
      },
      orderBy: {
        createdAt: 'asc',
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

  // 获取数据库中实际存在的城市列表（根据用户权限过滤）
  async getCities(currentUser: any): Promise<string[]> {
    try {
      if (!currentUser) {
        return [];
      }
      
      // 对于超级管理员，直接查询所有城市 - 使用PostgreSQL优化的查询
      if (currentUser.role === 'super_admin') {
        const cities = await this.prisma.inquiry.findMany({
          select: {
            city: true,
          },
          distinct: ['city'],
          orderBy: {
            city: 'asc',
          },
        });
        const result = cities.map(item => item.city);
        return result;
      }
      
      // 对于普通管理员，先获取用户可管理的城市列表
      const manageableCities = await this.cityFilterService.getAccessibleCities(currentUser);
      
      if (manageableCities.length === 0) {
        return [];
      }
      
      // 查询数据库中实际存在的城市，但只返回用户有权限的城市 - 使用PostgreSQL优化的查询
      const cities = await this.prisma.inquiry.findMany({
        where: {
          city: {
            in: manageableCities,
          },
        },
        select: {
          city: true,
        },
        distinct: ['city'],
        orderBy: {
          city: 'asc',
        },
      });

      const result = cities.map(item => item.city);
      
      return result;
    } catch (error) {
      console.error('getCities 服务层错误:', error);
      return [];
    }
  }
}

