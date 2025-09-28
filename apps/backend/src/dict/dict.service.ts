import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { dict_items, dict_categories } from '../../generated/prisma';

interface CreateDictCategoryData {
  code: string;
  name: string;
  description?: string;
}

interface UpdateDictCategoryData {
  code?: string;
  name?: string;
  description?: string;
}

interface CreateDictItemData {
  categoryCode: string;
  code: string;
  label: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
}

interface UpdateDictItemData {
  categoryCode?: string;
  code?: string;
  label?: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
}

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 字典分类方法 ====================
  async findAllCategories(): Promise<dict_categories[]> {
    return this.prisma.dict_categories.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCategory(data: CreateDictCategoryData): Promise<dict_categories> {
    return this.prisma.dict_categories.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
      },
    });
  }

  async updateCategory(id: number, data: UpdateDictCategoryData): Promise<dict_categories> {
    return this.prisma.dict_categories.update({
      where: { id },
      data: {
        ...data,
        description: data.description || null,
      },
    });
  }

  async deleteCategory(id: number): Promise<void> {
    await this.prisma.dict_categories.delete({
      where: { id },
    });
  }

  // ==================== 字典项方法 ====================
  async findByType(type: string): Promise<dict_items[]> {
    return this.prisma.dict_items.findMany({
      where: { categoryCode: type },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: CreateDictItemData): Promise<dict_items> {
    return this.prisma.dict_items.create({
      data: {
        categoryCode: data.categoryCode,
        code: data.code,
        label: data.label,
        value: data.value || null,
        sortOrder: data.sortOrder || 0,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        description: data.description || null,
      },
    });
  }

  async update(id: number, data: UpdateDictItemData): Promise<dict_items> {
    return this.prisma.dict_items.update({
      where: { id },
      data: {
        ...data,
        value: data.value || null,
        description: data.description || null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.dict_items.delete({
      where: { id },
    });
  }

  async toggle(id: number, isEnabled: boolean): Promise<dict_items> {
    return this.prisma.dict_items.update({
      where: { id },
      data: { isEnabled },
    });
  }
}
