import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma';
import {
  buildRecentDateKeySet,
  buildWritingDeltaEvents,
  getDateKeyInTimeZone,
} from '../common/writing-stats.util';

export interface WorkspaceTodo extends Prisma.JsonObject {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface WorkspaceIdea extends Prisma.JsonObject {
  id: string;
  content: string;
  createdAt: string;
}

export interface WorkspaceItems {
  todos: WorkspaceTodo[];
  ideas: WorkspaceIdea[];
}

const WORKSPACE_MISC_NAME = '__moge_workspace__';
const WORKSPACE_MISC_TYPE = 'workspace_private';

/**
 * 工作台服务
 * 提供工作台数据聚合功能
 */
@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isWorkspaceTodo(value: unknown): value is WorkspaceTodo {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id === 'string' &&
      typeof value.text === 'string' &&
      typeof value.done === 'boolean' &&
      typeof value.createdAt === 'string'
    );
  }

  private isWorkspaceIdea(value: unknown): value is WorkspaceIdea {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id === 'string' &&
      typeof value.content === 'string' &&
      typeof value.createdAt === 'string'
    );
  }

  private parseTodos(value: Prisma.JsonValue | null): WorkspaceTodo[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item) => this.isWorkspaceTodo(item));
  }

  private parseIdeas(value: Prisma.JsonValue | null): WorkspaceIdea[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item) => this.isWorkspaceIdea(item));
  }

  private async getWorkspaceRecord(userId: number) {
    const existing = await this.prisma.misc_settings.findFirst({
      where: {
        userId,
        name: WORKSPACE_MISC_NAME,
        type: WORKSPACE_MISC_TYPE,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.misc_settings.create({
      data: {
        userId,
        name: WORKSPACE_MISC_NAME,
        type: WORKSPACE_MISC_TYPE,
        description: '工作台待办与灵感便签内部存储',
        inspirations: [],
        notes: [],
        tags: ['workspace-internal'],
      },
    });
  }

  private async saveWorkspaceItems(userId: number, items: WorkspaceItems): Promise<WorkspaceItems> {
    const record = await this.getWorkspaceRecord(userId);
    await this.prisma.misc_settings.update({
      where: { id: record.id },
      data: {
        notes: items.todos,
        inspirations: items.ideas,
      },
    });

    return items;
  }

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
   * 获取工作台待办和灵感
   * @param userId 用户ID
   * @returns 工作台待办和灵感列表
   */
  async getWorkspaceItems(userId: number): Promise<WorkspaceItems> {
    const record = await this.getWorkspaceRecord(userId);

    return {
      todos: this.parseTodos(record.notes),
      ideas: this.parseIdeas(record.inspirations),
    };
  }

  /**
   * 创建工作台待办
   * @param userId 用户ID
   * @param text 待办内容
   * @returns 创建后的待办
   */
  async createTodo(userId: number, text: string): Promise<WorkspaceTodo> {
    const items = await this.getWorkspaceItems(userId);
    const todo: WorkspaceTodo = {
      id: randomUUID(),
      text: text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };

    await this.saveWorkspaceItems(userId, {
      ...items,
      todos: [todo, ...items.todos],
    });

    return todo;
  }

  /**
   * 更新工作台待办完成状态
   * @param userId 用户ID
   * @param id 待办ID
   * @param done 是否完成
   * @returns 更新后的工作台待办列表
   */
  async updateTodo(userId: number, id: string, done: boolean): Promise<WorkspaceItems> {
    const items = await this.getWorkspaceItems(userId);
    return this.saveWorkspaceItems(userId, {
      ...items,
      todos: items.todos.map((todo) => (todo.id === id ? { ...todo, done } : todo)),
    });
  }

  /**
   * 删除工作台待办
   * @param userId 用户ID
   * @param id 待办ID
   * @returns 更新后的工作台待办列表
   */
  async deleteTodo(userId: number, id: string): Promise<WorkspaceItems> {
    const items = await this.getWorkspaceItems(userId);
    return this.saveWorkspaceItems(userId, {
      ...items,
      todos: items.todos.filter((todo) => todo.id !== id),
    });
  }

  /**
   * 创建工作台灵感
   * @param userId 用户ID
   * @param content 灵感内容
   * @returns 创建后的灵感
   */
  async createIdea(userId: number, content: string): Promise<WorkspaceIdea> {
    const items = await this.getWorkspaceItems(userId);
    const idea: WorkspaceIdea = {
      id: randomUUID(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    await this.saveWorkspaceItems(userId, {
      ...items,
      ideas: [idea, ...items.ideas],
    });

    return idea;
  }

  /**
   * 删除工作台灵感
   * @param userId 用户ID
   * @param id 灵感ID
   * @returns 更新后的工作台灵感列表
   */
  async deleteIdea(userId: number, id: string): Promise<WorkspaceItems> {
    const items = await this.getWorkspaceItems(userId);
    return this.saveWorkspaceItems(userId, {
      ...items,
      ideas: items.ideas.filter((idea) => idea.id !== id),
    });
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
    const todayKey = getDateKeyInTimeZone(new Date());
    const recentDateKeys = buildRecentDateKeySet(7);
    const writingEvents = await this.getWritingEvents(userId);

    const todayWords = writingEvents.reduce((sum, event) => {
      if (getDateKeyInTimeZone(event.occurredAt) !== todayKey) {
        return sum;
      }

      return sum + event.words;
    }, 0);

    const weekWords = writingEvents.reduce((sum, event) => {
      if (!recentDateKeys.has(getDateKeyInTimeZone(event.occurredAt))) {
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
