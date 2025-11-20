import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 工作台服务
 * 提供工作台数据聚合功能
 */
@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

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
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 获取今日写作字数
    const todayChapters = await this.prisma.manuscript_chapter_content.findMany({
      where: {
        chapter: {
          manuscript: {
            userId,
          },
        },
        updatedAt: {
          gte: today,
        },
      },
      select: {
        content: true,
        chapterId: true,
      },
    });

    // 计算今日字数
    const todayWords = todayChapters.reduce((sum, ch) => {
      const cleanContent = ch.content.replace(/[#*_`~[\]()]/g, '').replace(/\s+/g, '');
      return sum + cleanContent.length;
    }, 0);

    // 获取本周写作字数
    const weekChapters = await this.prisma.manuscript_chapter_content.findMany({
      where: {
        chapter: {
          manuscript: {
            userId,
          },
        },
        updatedAt: {
          gte: weekAgo,
        },
      },
      select: {
        content: true,
      },
    });

    // 计算本周字数
    const weekWords = weekChapters.reduce((sum, ch) => {
      const cleanContent = ch.content.replace(/[#*_`~[\]()]/g, '').replace(/\s+/g, '');
      return sum + cleanContent.length;
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
