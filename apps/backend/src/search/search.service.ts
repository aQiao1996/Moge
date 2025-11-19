import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResultItem {
  id: number;
  type: 'character' | 'system' | 'world' | 'misc';
  name: string;
  description: string;
  projectId: number | null;
}

/**
 * 统一搜索服务
 * 用于 @ 引用系统，搜索所有类型的设定
 */
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 统一搜索设定
   * @param q 搜索关键词
   * @param projectId 项目ID（可选，用于筛选项目内的设定）
   * @param userId 用户ID
   * @returns 搜索结果列表
   */
  async searchSettings(
    q: string,
    projectId?: number,
    userId?: number
  ): Promise<SearchResultItem[]> {
    const results: SearchResultItem[] = [];

    // 搜索条件
    const searchCondition = {
      name: {
        contains: q,
        mode: 'insensitive' as const,
      },
      ...(userId && { userId }),
    };

    // 1. 搜索角色设定
    const characters = await this.prisma.character_settings.findMany({
      where: searchCondition,
      select: {
        id: true,
        name: true,
        background: true,
      },
      take: 10,
    });

    characters.forEach((char) => {
      results.push({
        id: char.id,
        type: 'character',
        name: char.name,
        description: char.background || '',
        projectId: null, // character_settings 表没有 projectId 字段
      });
    });

    // 2. 搜索系统设定
    const systems = await this.prisma.system_settings.findMany({
      where: searchCondition,
      select: {
        id: true,
        name: true,
        description: true,
      },
      take: 10,
    });

    systems.forEach((sys) => {
      results.push({
        id: sys.id,
        type: 'system',
        name: sys.name,
        description: sys.description || '',
        projectId: null, // system_settings 表没有 projectId 字段
      });
    });

    // 3. 搜索世界设定
    const worlds = await this.prisma.world_settings.findMany({
      where: searchCondition,
      select: {
        id: true,
        name: true,
        description: true,
      },
      take: 10,
    });

    worlds.forEach((world) => {
      results.push({
        id: world.id,
        type: 'world',
        name: world.name,
        description: world.description || '',
        projectId: null, // world_settings 表没有 projectId 字段
      });
    });

    // 4. 搜索辅助设定
    const miscs = await this.prisma.misc_settings.findMany({
      where: searchCondition,
      select: {
        id: true,
        name: true,
        description: true,
      },
      take: 10,
    });

    miscs.forEach((misc) => {
      results.push({
        id: misc.id,
        type: 'misc',
        name: misc.name,
        description: misc.description || '',
        projectId: null, // misc_settings 表没有 projectId 字段
      });
    });

    // 如果指定了projectId，需要通过projects表关联查询
    if (projectId) {
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: {
          characters: true,
          systems: true,
          worlds: true,
          misc: true,
        },
      });

      if (project) {
        // 只返回项目关联的设定
        const relatedIds = new Set([
          ...project.characters.map((id) => `character-${id}`),
          ...project.systems.map((id) => `system-${id}`),
          ...project.worlds.map((id) => `world-${id}`),
          ...project.misc.map((id) => `misc-${id}`),
        ]);

        return results.filter((item) => {
          const itemKey = `${item.type}-${item.id}`;
          return relatedIds.has(itemKey);
        });
      }
    }

    return results;
  }

  /**
   * 根据类型和ID获取设定详情
   * @param type 设定类型
   * @param id 设定ID
   * @param userId 用户ID
   * @returns 设定详情
   */
  async getSettingByTypeAndId(
    type: 'character' | 'system' | 'world' | 'misc',
    id: number,
    userId?: number
  ) {
    const whereCondition = {
      id,
      ...(userId && { userId }),
    };

    switch (type) {
      case 'character':
        return await this.prisma.character_settings.findFirst({
          where: whereCondition,
        });

      case 'system':
        return await this.prisma.system_settings.findFirst({
          where: whereCondition,
        });

      case 'world':
        return await this.prisma.world_settings.findFirst({
          where: whereCondition,
        });

      case 'misc':
        return await this.prisma.misc_settings.findFirst({
          where: whereCondition,
        });

      default:
        return null;
    }
  }
}
