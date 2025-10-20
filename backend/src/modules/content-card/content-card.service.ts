import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContentCardDto } from './dto/create-content-card.dto';
import { UpdateContentCardDto } from './dto/update-content-card.dto';

@Injectable()
export class ContentCardService {
  constructor(private prisma: PrismaService) {}

  async create(createContentCardDto: CreateContentCardDto) {
    return this.prisma.contentCard.create({
      data: createContentCardDto,
      include: {
        module: true,
        article: true,
      },
    });
  }

  async findAll(moduleId?: string, activeOnly: boolean = false) {
    return this.prisma.contentCard.findMany({
      where: {
        ...(moduleId ? { moduleId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        module: true,
        article: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.contentCard.findUnique({
      where: { id },
      include: {
        module: true,
        article: true,
      },
    });
  }

  async update(id: string, updateContentCardDto: UpdateContentCardDto) {
    return this.prisma.contentCard.update({
      where: { id },
      data: updateContentCardDto,
      include: {
        module: true,
        article: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.contentCard.delete({
      where: { id },
    });
  }
}



