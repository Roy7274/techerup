import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContentModuleDto } from './dto/create-content-module.dto';
import { UpdateContentModuleDto } from './dto/update-content-module.dto';

@Injectable()
export class ContentModuleService {
  constructor(private prisma: PrismaService) {}

  async create(createContentModuleDto: CreateContentModuleDto) {
    return this.prisma.contentModule.create({
      data: createContentModuleDto,
    });
  }

  async findAll(activeOnly: boolean = false) {
    return this.prisma.contentModule.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        cards: {
          where: activeOnly ? { isActive: true } : undefined,
          orderBy: {
            order: 'asc',
          },
          include: {
            article: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.contentModule.findUnique({
      where: { id },
      include: {
        cards: {
          include: {
            article: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, updateContentModuleDto: UpdateContentModuleDto) {
    return this.prisma.contentModule.update({
      where: { id },
      data: updateContentModuleDto,
    });
  }

  async remove(id: string) {
    return this.prisma.contentModule.delete({
      where: { id },
    });
  }
}



