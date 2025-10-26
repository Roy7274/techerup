import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 获取所有管理员
  @Get('list')
  async getAllAdmins(@Request() req) {
    return this.adminService.getAllAdmins(req.user);
  }

  // 创建新管理员
  @Post('create')
  async createAdmin(@Request() req, @Body() body: {
    username: string;
    password: string;
    email?: string;
    role: string;
    cities: string[];
  }) {
    return this.adminService.createAdmin(req.user, body);
  }

  // 更新管理员信息
  @Put(':id')
  async updateAdmin(@Request() req, @Param('id') id: string, @Body() body: {
    email?: string;
    role?: string;
    cities?: string[];
    isActive?: boolean;
  }) {
    return this.adminService.updateAdmin(req.user, id, body);
  }

  // 重置管理员密码
  @Put(':id/reset-password')
  async resetPassword(@Request() req, @Param('id') id: string, @Body() body: {
    newPassword: string;
  }) {
    return this.adminService.resetPassword(req.user, id, body.newPassword);
  }

  // 删除管理员
  @Delete(':id')
  async deleteAdmin(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteAdmin(req.user, id);
  }

  // 获取可管理的城市列表
  @Get('cities')
  async getManageableCities(@Request() req) {
    return this.adminService.getManageableCities(req.user);
  }
}
