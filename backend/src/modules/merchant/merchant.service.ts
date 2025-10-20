import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async create(createMerchantDto: CreateMerchantDto) {
    return this.prisma.merchantInfo.create({
      data: createMerchantDto,
    });
  }

  async findAll() {
    return this.prisma.merchantInfo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findActive() {
    return this.prisma.merchantInfo.findFirst({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.merchantInfo.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto) {
    return this.prisma.merchantInfo.update({
      where: { id },
      data: updateMerchantDto,
    });
  }

  async remove(id: string) {
    return this.prisma.merchantInfo.delete({
      where: { id },
    });
  }
}

