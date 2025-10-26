import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 获取所有管理员（仅超级管理员可访问）
  async getAllAdmins(currentUser: any) {
    if (currentUser.role !== 'super_admin') {
      throw new ForbiddenException('只有超级管理员可以查看所有管理员');
    }

    return this.prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        cities: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 创建新管理员（仅超级管理员可操作）
  async createAdmin(currentUser: any, adminData: {
    username: string;
    password: string;
    email?: string;
    role: string;
    cities: string[];
  }) {
    if (currentUser.role !== 'super_admin') {
      throw new ForbiddenException('只有超级管理员可以创建管理员');
    }

    // 检查用户名是否已存在
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { username: adminData.username },
    });

    if (existingAdmin) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        username: adminData.username,
        password: hashedPassword,
        email: adminData.email,
        role: adminData.role,
        cities: adminData.cities,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        cities: true,
        isActive: true,
        createdAt: true,
      },
    });

    return admin;
  }

  // 更新管理员信息（仅超级管理员可操作）
  async updateAdmin(currentUser: any, adminId: string, updateData: {
    email?: string;
    role?: string;
    cities?: string[];
    isActive?: boolean;
  }) {
    if (currentUser.role !== 'super_admin') {
      throw new ForbiddenException('只有超级管理员可以更新管理员信息');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    return this.prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        cities: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // 重置管理员密码（仅超级管理员可操作）
  async resetPassword(currentUser: any, adminId: string, newPassword: string) {
    if (currentUser.role !== 'super_admin') {
      throw new ForbiddenException('只有超级管理员可以重置密码');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        cities: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // 删除管理员（仅超级管理员可操作）
  async deleteAdmin(currentUser: any, adminId: string) {
    if (currentUser.role !== 'super_admin') {
      throw new ForbiddenException('只有超级管理员可以删除管理员');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    // 不能删除自己
    if (adminId === currentUser.sub) {
      throw new ForbiddenException('不能删除自己的账号');
    }

    await this.prisma.admin.delete({
      where: { id: adminId },
    });

    return { message: '管理员删除成功' };
  }

  // 获取当前用户可管理的城市列表
  async getManageableCities(currentUser: any) {
    if (currentUser.role === 'super_admin') {
      // 超级管理员可以管理所有城市，返回所有可能的城市
      return [
        '北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', 
        '重庆', '武汉', '西安', '天津', '青岛', '大连', '厦门', '宁波',
        '福州', '济南', '长沙', '郑州', '沈阳', '哈尔滨', '长春', '石家庄',
        '太原', '呼和浩特', '兰州', '西宁', '银川', '乌鲁木齐', '拉萨'
      ];
    } else {
      // 普通管理员只能管理自己分配的城市
      const admin = await this.prisma.admin.findUnique({
        where: { id: currentUser.sub },
        select: { cities: true },
      });
      return admin?.cities || [];
    }
  }

  // 检查用户是否有权限访问特定城市的数据
  async canAccessCity(currentUser: any, city: string): Promise<boolean> {
    if (currentUser.role === 'super_admin') {
      return true; // 超级管理员可以访问所有城市
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: currentUser.sub },
      select: { cities: true },
    });

    return admin?.cities.includes(city) || false;
  }
}
