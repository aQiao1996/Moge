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

/**
 * 字典数据服务
 * 提供字典分类和字典项的CRUD操作，以及统计功能
 */
@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 字典分类方法 ====================

  /**
   * 获取所有字典分类
   * @returns 字典分类数组，按创建时间升序排列
   */
  async findAllCategories(): Promise<dict_categories[]> {
    return this.prisma.dict_categories.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 创建新的字典分类
   * @param data 字典分类数据
   * @returns 创建的字典分类对象
   */
  async createCategory(data: CreateDictCategoryData): Promise<dict_categories> {
    return this.prisma.dict_categories.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
      },
    });
  }

  /**
   * 更新字典分类信息
   * @param id 字典分类ID
   * @param data 更新数据
   * @returns 更新后的字典分类对象
   */
  async updateCategory(id: number, data: UpdateDictCategoryData): Promise<dict_categories> {
    return this.prisma.dict_categories.update({
      where: { id },
      data: {
        ...data,
        description: data.description || null,
      },
    });
  }

  /**
   * 删除字典分类
   * @param id 字典分类ID
   * @throws 当分类下还有字典项时可能抛出外键约束错误
   */
  async deleteCategory(id: number): Promise<void> {
    await this.prisma.dict_categories.delete({
      where: { id },
    });
  }

  // ==================== 统计方法 ====================

  /**
   * 获取字典统计数据
   * 统计各个分类下的字典项数量
   * @returns 包含分类代码和对应数量的数组
   */
  async getStatistics(): Promise<{ categoryCode: string; count: number }[]> {
    const results = await this.prisma.dict_items.groupBy({
      by: ['categoryCode'],
      _count: {
        id: true,
      },
      orderBy: {
        categoryCode: 'asc',
      },
    });

    return results.map((result) => ({
      categoryCode: result.categoryCode,
      count: result._count.id,
    }));
  }

  // ==================== 字典项方法 ====================

  /**
   * 根据分类类型查询字典项
   * @param type 分类类型代码
   * @returns 该分类下的所有字典项，按排序字段升序排列
   */
  async findByType(type: string): Promise<dict_items[]> {
    return this.prisma.dict_items.findMany({
      where: { categoryCode: type },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 创建新的字典项
   * @param data 字典项数据
   * @returns 创建的字典项对象
   */
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

  /**
   * 更新字典项信息
   * @param id 字典项ID
   * @param data 更新数据
   * @returns 更新后的字典项对象
   */
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

  /**
   * 删除字典项
   * @param id 字典项ID
   */
  async delete(id: number): Promise<void> {
    await this.prisma.dict_items.delete({
      where: { id },
    });
  }

  /**
   * 切换字典项的启用状态
   * @param id 字典项ID
   * @param isEnabled 是否启用
   * @returns 更新后的字典项对象
   */
  async toggle(id: number, isEnabled: boolean): Promise<dict_items> {
    return this.prisma.dict_items.update({
      where: { id },
      data: { isEnabled },
    });
  }
}
