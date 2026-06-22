import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DictScope, DictShareStatus, Prisma } from '../../generated/prisma';
import type { dict_items, dict_categories, dict_item_versions } from '../../generated/prisma';

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
  label: string;
  value: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
  scope?: DictScope;
  projectId?: number | null;
}

interface UpdateDictItemData {
  categoryCode?: string;
  label?: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
  scope?: DictScope;
  projectId?: number | null;
}

interface FindDictItemsOptions {
  projectId?: number;
  scope?: DictScope;
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
  async getStatistics(userId?: number): Promise<{ categoryCode: string; count: number }[]> {
    const results = await this.prisma.dict_items.groupBy({
      by: ['categoryCode'],
      where: this.buildReadableWhere(userId),
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
  async findByType(
    type: string,
    userId?: number,
    options: FindDictItemsOptions = {}
  ): Promise<dict_items[]> {
    const projectId = options.projectId;
    if (projectId && userId) {
      await this.ensureProjectAccess(userId, projectId);
    }

    const items = await this.prisma.dict_items.findMany({
      where: {
        categoryCode: type,
        ...this.buildReadableWhere(userId, projectId, options.scope),
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (options.scope) {
      return items;
    }

    return this.mergeScopedItems(items);
  }

  /**
   * 创建新的字典项
   * @param data 字典项数据
   * @returns 创建的字典项对象
   */
  async create(userId: number, data: CreateDictItemData): Promise<dict_items> {
    const scope = data.scope ?? DictScope.USER;
    const projectId = scope === DictScope.PROJECT ? data.projectId : null;

    if (scope === DictScope.SYSTEM) {
      throw new ForbiddenException('暂不支持通过接口创建系统级词条');
    }

    if (scope === DictScope.PROJECT) {
      if (!projectId) {
        throw new BadRequestException('项目级词条必须绑定项目');
      }
      await this.ensureProjectAccess(userId, projectId);
    }

    await this.ensureUniqueValue({
      categoryCode: data.categoryCode,
      value: data.value,
      scope,
      userId,
      projectId,
    });

    return this.prisma.dict_items.create({
      data: {
        categoryCode: data.categoryCode,
        label: data.label,
        value: data.value,
        sortOrder: data.sortOrder || 0,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        description: data.description || null,
        scope,
        userId,
        projectId,
      },
    });
  }

  /**
   * 更新字典项信息
   * @param id 字典项ID
   * @param data 更新数据
   * @returns 更新后的字典项对象
   */
  async update(userId: number, id: number, data: UpdateDictItemData): Promise<dict_items> {
    return this.prisma.$transaction(async (tx) => {
      const existingItem = await tx.dict_items.findUnique({ where: { id } });

      if (!existingItem) {
        throw new NotFoundException('词条不存在');
      }

      this.assertWritable(userId, existingItem);

      const nextScope = data.scope ?? existingItem.scope;
      const nextProjectId =
        nextScope === DictScope.PROJECT ? (data.projectId ?? existingItem.projectId) : null;

      if (nextScope === DictScope.SYSTEM) {
        throw new ForbiddenException('暂不支持通过接口改为系统级词条');
      }

      if (nextScope === DictScope.PROJECT) {
        if (!nextProjectId) {
          throw new BadRequestException('项目级词条必须绑定项目');
        }
        await this.ensureProjectAccess(userId, nextProjectId);
      }

      await this.ensureUniqueValue(
        {
          categoryCode: data.categoryCode ?? existingItem.categoryCode,
          value: data.value ?? existingItem.value,
          scope: nextScope,
          userId,
          projectId: nextProjectId,
        },
        id
      );

      await tx.dict_item_versions.create({
        data: {
          dictItemId: existingItem.id,
          version: existingItem.version,
          label: existingItem.label,
          value: existingItem.value,
          description: existingItem.description,
          sortOrder: existingItem.sortOrder,
          isEnabled: existingItem.isEnabled,
        },
      });

      return tx.dict_items.update({
        where: { id },
        data: {
          categoryCode: data.categoryCode,
          label: data.label,
          value: data.value,
          sortOrder: data.sortOrder,
          isEnabled: data.isEnabled,
          description: data.description === undefined ? undefined : data.description || null,
          scope: nextScope,
          userId,
          projectId: nextProjectId,
          version: { increment: 1 },
        },
      });
    });
  }

  /**
   * 删除字典项
   * @param id 字典项ID
   */
  async delete(userId: number, id: number): Promise<void> {
    const existingItem = await this.prisma.dict_items.findUnique({ where: { id } });
    if (!existingItem) {
      throw new NotFoundException('词条不存在');
    }
    this.assertWritable(userId, existingItem);

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
  async toggle(userId: number, id: number, isEnabled: boolean): Promise<dict_items> {
    const existingItem = await this.prisma.dict_items.findUnique({ where: { id } });
    if (!existingItem) {
      throw new NotFoundException('词条不存在');
    }
    this.assertWritable(userId, existingItem);

    return this.update(userId, id, { isEnabled });
  }

  async findVersions(userId: number, id: number): Promise<dict_item_versions[]> {
    const existingItem = await this.prisma.dict_items.findUnique({ where: { id } });
    if (!existingItem) {
      throw new NotFoundException('词条不存在');
    }
    this.assertReadable(userId, existingItem);

    return this.prisma.dict_item_versions.findMany({
      where: { dictItemId: id },
      orderBy: { version: 'desc' },
    });
  }

  async share(userId: number, id: number): Promise<dict_items> {
    const existingItem = await this.prisma.dict_items.findUnique({ where: { id } });
    if (!existingItem) {
      throw new NotFoundException('词条不存在');
    }
    if (existingItem.scope !== DictScope.USER || existingItem.userId !== userId) {
      throw new ForbiddenException('仅支持分享自己的个人词条');
    }

    return this.prisma.dict_items.update({
      where: { id },
      data: { shareStatus: DictShareStatus.SHARED },
    });
  }

  async archiveShare(userId: number, id: number): Promise<dict_items> {
    const existingItem = await this.prisma.dict_items.findUnique({ where: { id } });
    if (!existingItem) {
      throw new NotFoundException('词条不存在');
    }
    if (existingItem.scope !== DictScope.USER || existingItem.userId !== userId) {
      throw new ForbiddenException('仅支持取消分享自己的个人词条');
    }

    return this.prisma.dict_items.update({
      where: { id },
      data: { shareStatus: DictShareStatus.ARCHIVED },
    });
  }

  async findCommunity(type?: string): Promise<dict_items[]> {
    return this.prisma.dict_items.findMany({
      where: {
        categoryCode: type,
        shareStatus: DictShareStatus.SHARED,
      },
      orderBy: [{ updatedAt: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async fork(userId: number, id: number): Promise<dict_items> {
    const sourceItem = await this.prisma.dict_items.findUnique({ where: { id } });
    if (!sourceItem) {
      throw new NotFoundException('词条不存在');
    }
    if (
      sourceItem.scope !== DictScope.SYSTEM &&
      sourceItem.shareStatus !== DictShareStatus.SHARED
    ) {
      throw new ForbiddenException('仅支持复制系统词条或社区共享词条');
    }

    await this.ensureUniqueValue(
      {
        categoryCode: sourceItem.categoryCode,
        value: sourceItem.value,
        scope: DictScope.USER,
        userId,
        projectId: null,
      },
      sourceItem.userId === userId ? sourceItem.id : undefined
    );

    return this.prisma.dict_items.create({
      data: {
        categoryCode: sourceItem.categoryCode,
        label: sourceItem.label,
        value: sourceItem.value,
        description: sourceItem.description,
        sortOrder: sourceItem.sortOrder,
        isEnabled: sourceItem.isEnabled,
        scope: DictScope.USER,
        userId,
        projectId: null,
        sourceItemId: sourceItem.id,
      },
    });
  }

  private buildReadableWhere(
    userId?: number,
    projectId?: number,
    scope?: DictScope
  ): Prisma.dict_itemsWhereInput {
    if (scope) {
      if (scope === DictScope.SYSTEM) {
        return { scope };
      }

      if (scope === DictScope.USER) {
        return { scope, userId };
      }

      return { scope, userId, projectId };
    }

    return {
      OR: [
        { scope: DictScope.SYSTEM },
        ...(userId ? [{ scope: DictScope.USER, userId }] : []),
        ...(userId && projectId ? [{ scope: DictScope.PROJECT, userId, projectId }] : []),
      ],
    };
  }

  private mergeScopedItems(items: dict_items[]): dict_items[] {
    const priorityMap: Record<DictScope, number> = {
      [DictScope.SYSTEM]: 1,
      [DictScope.USER]: 2,
      [DictScope.PROJECT]: 3,
    };
    const itemMap = new Map<string, dict_items>();

    for (const item of items) {
      const currentItem = itemMap.get(item.value);
      if (!currentItem || priorityMap[item.scope] >= priorityMap[currentItem.scope]) {
        itemMap.set(item.value, item);
      }
    }

    return [...itemMap.values()].sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.label.localeCompare(right.label, 'zh-CN');
    });
  }

  private async ensureProjectAccess(userId: number, projectId: number): Promise<void> {
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权访问');
    }
  }

  private async ensureUniqueValue(
    params: {
      categoryCode: string;
      value: string;
      scope: DictScope;
      userId: number | null;
      projectId: number | null;
    },
    ignoreId?: number
  ): Promise<void> {
    const existingItem = await this.prisma.dict_items.findFirst({
      where: {
        categoryCode: params.categoryCode,
        value: params.value,
        scope: params.scope,
        userId: params.scope === DictScope.SYSTEM ? null : params.userId,
        projectId: params.scope === DictScope.PROJECT ? params.projectId : null,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
      select: { id: true },
    });

    if (existingItem) {
      throw new BadRequestException('当前作用域下已存在相同存储值的词条');
    }
  }

  private assertReadable(userId: number, item: dict_items): void {
    if (item.scope === DictScope.SYSTEM || item.shareStatus === DictShareStatus.SHARED) {
      return;
    }

    if (item.userId === userId) {
      return;
    }

    throw new ForbiddenException('无权访问该词条');
  }

  private assertWritable(userId: number, item: dict_items): void {
    if (item.scope === DictScope.SYSTEM) {
      throw new ForbiddenException('系统级词条暂不支持编辑');
    }

    if (item.userId !== userId) {
      throw new ForbiddenException('无权编辑该词条');
    }
  }
}
