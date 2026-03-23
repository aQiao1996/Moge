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

  private static readonly SEARCH_LIMIT = 10;

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
    const searchCondition = {
      name: {
        contains: q,
        mode: 'insensitive' as const,
      },
      ...(userId && { userId }),
    };

    let relatedIds:
      | {
          characters: number[];
          systems: number[];
          worlds: number[];
          misc: number[];
        }
      | undefined;

    // 如果指定了项目，则先约束到当前项目关联的设定，再执行搜索。
    if (projectId) {
      const project = await this.prisma.projects.findFirst({
        where: {
          id: projectId,
          ...(userId && { userId }),
        },
        select: {
          characters: true,
          systems: true,
          worlds: true,
          misc: true,
        },
      });

      if (!project) {
        return [];
      }

      relatedIds = {
        characters: this.parseSettingIds(project.characters),
        systems: this.parseSettingIds(project.systems),
        worlds: this.parseSettingIds(project.worlds),
        misc: this.parseSettingIds(project.misc),
      };
    }

    const [characters, systems, worlds, miscs] = await Promise.all([
      this.searchCharacters(searchCondition, relatedIds?.characters),
      this.searchSystems(searchCondition, relatedIds?.systems),
      this.searchWorlds(searchCondition, relatedIds?.worlds),
      this.searchMiscs(searchCondition, relatedIds?.misc),
    ]);

    return [...characters, ...systems, ...worlds, ...miscs];
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

  private parseSettingIds(ids: string[]): number[] {
    return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
  }

  private buildSearchWhere(
    searchCondition: {
      name: { contains: string; mode: 'insensitive' };
      userId?: number;
    },
    relatedIds?: number[]
  ) {
    if (relatedIds && relatedIds.length === 0) {
      return null;
    }

    return {
      ...searchCondition,
      ...(relatedIds ? { id: { in: relatedIds } } : {}),
    };
  }

  private async searchCharacters(
    searchCondition: {
      name: { contains: string; mode: 'insensitive' };
      userId?: number;
    },
    relatedIds?: number[]
  ): Promise<SearchResultItem[]> {
    const where = this.buildSearchWhere(searchCondition, relatedIds);
    if (!where) {
      return [];
    }

    const characters = await this.prisma.character_settings.findMany({
      where,
      select: {
        id: true,
        name: true,
        background: true,
      },
      take: SearchService.SEARCH_LIMIT,
    });

    return characters.map((char) => ({
      id: char.id,
      type: 'character',
      name: char.name,
      description: char.background || '',
      projectId: null,
    }));
  }

  private async searchSystems(
    searchCondition: {
      name: { contains: string; mode: 'insensitive' };
      userId?: number;
    },
    relatedIds?: number[]
  ): Promise<SearchResultItem[]> {
    const where = this.buildSearchWhere(searchCondition, relatedIds);
    if (!where) {
      return [];
    }

    const systems = await this.prisma.system_settings.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
      },
      take: SearchService.SEARCH_LIMIT,
    });

    return systems.map((sys) => ({
      id: sys.id,
      type: 'system',
      name: sys.name,
      description: sys.description || '',
      projectId: null,
    }));
  }

  private async searchWorlds(
    searchCondition: {
      name: { contains: string; mode: 'insensitive' };
      userId?: number;
    },
    relatedIds?: number[]
  ): Promise<SearchResultItem[]> {
    const where = this.buildSearchWhere(searchCondition, relatedIds);
    if (!where) {
      return [];
    }

    const worlds = await this.prisma.world_settings.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
      },
      take: SearchService.SEARCH_LIMIT,
    });

    return worlds.map((world) => ({
      id: world.id,
      type: 'world',
      name: world.name,
      description: world.description || '',
      projectId: null,
    }));
  }

  private async searchMiscs(
    searchCondition: {
      name: { contains: string; mode: 'insensitive' };
      userId?: number;
    },
    relatedIds?: number[]
  ): Promise<SearchResultItem[]> {
    const where = this.buildSearchWhere(searchCondition, relatedIds);
    if (!where) {
      return [];
    }

    const miscs = await this.prisma.misc_settings.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
      },
      take: SearchService.SEARCH_LIMIT,
    });

    return miscs.map((misc) => ({
      id: misc.id,
      type: 'misc',
      name: misc.name,
      description: misc.description || '',
      projectId: null,
    }));
  }

  /**
   * 获取反向链接
   * 查询哪些内容（大纲章节、文稿章节）引用了当前设定
   * @param type 设定类型
   * @param id 设定ID
   * @param userId 用户ID
   * @returns 反向链接列表
   */
  async getBacklinks(type: 'character' | 'system' | 'world' | 'misc', id: number, userId?: number) {
    const backlinks: Array<{
      id: number;
      type: 'outline_chapter' | 'manuscript_chapter';
      title: string;
      parentTitle: string;
      updatedAt: Date;
    }> = [];

    // 1. 搜索大纲章节内容中的引用
    const outlineChapters = await this.prisma.outline_chapter_content.findMany({
      where: {
        content: {
          contains: `moge://${type}/${id}`,
        },
      },
      include: {
        chapter: {
          include: {
            outline: {
              select: {
                id: true,
                name: true,
                userId: true,
              },
            },
          },
        },
      },
      take: 20,
    });

    for (const item of outlineChapters) {
      // 权限检查
      if (userId && item.chapter.outline?.userId !== userId) {
        continue;
      }

      backlinks.push({
        id: item.chapter.id,
        type: 'outline_chapter',
        title: item.chapter.title,
        parentTitle: item.chapter.outline?.name || '未命名大纲',
        updatedAt: item.updatedAt,
      });
    }

    // 2. 搜索文稿章节内容中的引用
    const manuscriptChapters = await this.prisma.manuscript_chapter_content.findMany({
      where: {
        content: {
          contains: `moge://${type}/${id}`,
        },
      },
      include: {
        chapter: {
          include: {
            manuscript: {
              select: {
                id: true,
                name: true,
                userId: true,
              },
            },
            volume: {
              include: {
                manuscript: {
                  select: {
                    id: true,
                    name: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 20,
    });

    for (const item of manuscriptChapters) {
      const manuscript = item.chapter.manuscript || item.chapter.volume?.manuscript;

      // 权限检查
      if (userId && manuscript?.userId !== userId) {
        continue;
      }

      backlinks.push({
        id: item.chapter.id,
        type: 'manuscript_chapter',
        title: item.chapter.title,
        parentTitle: manuscript?.name || '未命名文稿',
        updatedAt: item.updatedAt,
      });
    }

    // 按更新时间倒序排列
    backlinks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return backlinks;
  }
}
