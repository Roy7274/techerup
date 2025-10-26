import { Injectable } from '@nestjs/common';
import { AdminService } from './admin.service';

@Injectable()
export class CityFilterService {
  constructor(private adminService: AdminService) {}

  // 为查询添加城市过滤条件
  async addCityFilter(currentUser: any, whereClause: any = {}) {
    // 超级管理员可以查看所有数据
    if (currentUser.role === 'super_admin') {
      return whereClause;
    }

    // 普通管理员只能查看自己管理的城市的数据
    const manageableCities = await this.adminService.getManageableCities(currentUser);
    
    if (manageableCities.length === 0) {
      // 如果没有分配城市，返回空结果
      return { ...whereClause, id: 'no-access' };
    }

    // 添加城市过滤条件
    return {
      ...whereClause,
      city: {
        in: manageableCities,
      },
    };
  }

  // 检查用户是否有权限访问特定城市的数据
  async canAccessCity(currentUser: any, city: string): Promise<boolean> {
    return this.adminService.canAccessCity(currentUser, city);
  }

  // 获取用户可访问的城市列表
  async getAccessibleCities(currentUser: any): Promise<string[]> {
    return this.adminService.getManageableCities(currentUser);
  }
}
