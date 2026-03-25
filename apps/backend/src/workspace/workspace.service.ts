import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildWritingDeltaEvents } from '../common/writing-stats.util';

/**
 * 工作台服务
 * 提供工作台数据聚合功能
 */
@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  private getWritingChapterScope(userId: number) {
    return {
      OR: [
        {
          manuscript: {
            userId,
            deletedAt: null,
          },
        },
        {
          volume: {
            manuscript: {
              userId,
              deletedAt: null,
            },
          },
        },
      ],
    };
  }

  private async getWritingEvents(userId: number) {
    const chapterScope = this.getWritingChapterScope(userId);

    const [currentContents, versionRecords] = await Promise.all([
      this.prisma.manuscript_chapter_content.findMany({
        where: {
          chapter: chapterScope,
        },
        select: {
          id: true,
          version: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.manuscript_chapter_content_version.findMany({
        where: {
          contentRecord: {
            chapter: chapterScope,
          },
        },
        select: {
          contentId: true,
          version: true,
          content: true,
          createdAt: true,
        },
      }),
    ]);

    return buildWritingDeltaEvents(currentContents, versionRecords);
  }

  /**
   * 获取最近的项目
   * @param userId 用户ID
   * @param limit 限制数量
   */
  async getRecentProjects(userId: number, limit = 3) {
    return await this.prisma.projects.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 获取最近的大纲
   * @param userId 用户ID
   * @param limit 限制数量
   */
  async getRecentOutlines(userId: number, limit = 3) {
    return await this.prisma.outline.findMany({
      where: {
        userId,
        status: { not: 'DISCARDED' },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 获取最近的文稿
   * @param userId 用户ID
   * @param limit 限制数量
   */
  async getRecentManuscripts(userId: number, limit = 3) {
    return await this.prisma.manuscripts.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { lastEditedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        status: true,
        totalWords: true,
        lastEditedAt: true,
        lastEditedChapterId: true,
      },
    });
  }

  /**
   * 获取写作统计
   * @param userId 用户ID
   */
  async getWritingStats(userId: number) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const writingEvents = await this.getWritingEvents(userId);

    const todayWords = writingEvents.reduce((sum, event) => {
      if (event.occurredAt < today) {
        return sum;
      }

      return sum + event.words;
    }, 0);

    const weekWords = writingEvents.reduce((sum, event) => {
      if (event.occurredAt < weekAgo) {
        return sum;
      }

      return sum + event.words;
    }, 0);

    // 获取总字数
    const totalWords = await this.prisma.manuscripts.aggregate({
      where: {
        userId,
        deletedAt: null,
      },
      _sum: {
        totalWords: true,
      },
    });

    // 获取项目数量
    const projectCount = await this.prisma.projects.count({
      where: { userId },
    });

    // 获取文稿数量
    const manuscriptCount = await this.prisma.manuscripts.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return {
      todayWords,
      weekWords,
      totalWords: totalWords._sum.totalWords || 0,
      projectCount,
      manuscriptCount,
    };
  }

  /**
   * 获取工作台汇总数据
   * @param userId 用户ID
   */
  async getWorkspaceSummary(userId: number) {
    const [recentProjects, recentOutlines, recentManuscripts, stats] = await Promise.all([
      this.getRecentProjects(userId),
      this.getRecentOutlines(userId),
      this.getRecentManuscripts(userId),
      this.getWritingStats(userId),
    ]);

    return {
      recentProjects,
      recentOutlines,
      recentManuscripts,
      stats,
    };
  }
}
