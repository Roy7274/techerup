import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';

@Injectable()
export class FormTemplateService {
  constructor(private prisma: PrismaService) {}

  // 创建表单模板
  async create(createFormTemplateDto: CreateFormTemplateDto) {
    const { fields, ...templateData } = createFormTemplateDto;

    return this.prisma.formTemplate.create({
      data: {
        ...templateData,
        fields: fields
          ? {
              create: fields,
            }
          : undefined,
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  // 获取所有表单模板
  async findAll(activeOnly: boolean = false) {
    return this.prisma.formTemplate.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            autoReplies: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // 获取单个表单模板
  async findOne(id: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
        autoReplies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Form template with ID ${id} not found`);
    }

    return template;
  }

  // 更新表单模板
  async update(id: string, updateFormTemplateDto: UpdateFormTemplateDto) {
    const { fields, ...templateData } = updateFormTemplateDto;

    // 如果提供了字段数据，先删除旧字段再创建新字段
    if (fields) {
      await this.prisma.formField.deleteMany({
        where: { templateId: id },
      });
    }

    return this.prisma.formTemplate.update({
      where: { id },
      data: {
        ...templateData,
        fields: fields
          ? {
              create: fields,
            }
          : undefined,
      },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  // 删除表单模板
  async remove(id: string) {
    // 检查是否有自动回复关联
    const template = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            autoReplies: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Form template with ID ${id} not found`);
    }

    if (template._count.autoReplies > 0) {
      throw new Error(
        `Cannot delete template. It is being used by ${template._count.autoReplies} auto-reply(ies)`,
      );
    }

    return this.prisma.formTemplate.delete({
      where: { id },
    });
  }

  // 切换激活状态
  async toggleActive(id: string) {
    const template = await this.findOne(id);
    return this.prisma.formTemplate.update({
      where: { id },
      data: {
        isActive: !template.isActive,
      },
    });
  }
}


