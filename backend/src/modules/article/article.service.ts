import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto) {
    return this.prisma.article.create({
      data: createArticleDto,
    });
  }

  async findAll(activeOnly: boolean = false) {
    return this.prisma.article.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    // 增加浏览次数
    await this.prisma.article.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return this.prisma.article.findUnique({
      where: { id },
      include: {
        cards: true,
      },
    });
  }

  async update(id: string, updateArticleDto: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
    });
  }

  async remove(id: string) {
    return this.prisma.article.delete({
      where: { id },
    });
  }
}



