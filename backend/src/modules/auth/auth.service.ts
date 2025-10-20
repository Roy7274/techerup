import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (admin && await bcrypt.compare(password, admin.password)) {
      const { password, ...result } = admin;
      return result;
    }
    return null;
  }

  async login(username: string, password: string) {
    const admin = await this.validateUser(username, password);
    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 更新最后登录时间
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const payload = { sub: admin.id, username: admin.username, role: admin.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: admin,
    };
  }

  async register(username: string, password: string, email?: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await this.prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        email,
      },
    });

    const { password: _, ...result } = admin;
    return result;
  }

  async findById(id: string) {
    return this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }
}

