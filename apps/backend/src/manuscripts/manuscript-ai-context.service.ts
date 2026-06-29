import { Injectable } from '@nestjs/common';
import type { AiContextSourceItem } from '@moge/types';
import type { AIProvider } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, type project_ai_configs } from '../../generated/prisma';

interface ContextSettingItem {
  id?: number;
  name: string;
  background?: string | null;
  personality?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

interface ManuscriptContextConfig {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableCharacterContext: boolean;
  enableSystemContext: boolean;
  enableWorldContext: boolean;
  enableMiscContext: boolean;
  enableChapterSummaryContext?: boolean;
  enableProjectMemoryContext?: boolean;
  contextLengthStrategy?: 'COMPACT' | 'BALANCED' | 'EXPANDED';
  resultApplyStrategy?: 'CANDIDATE' | 'DIRECT_INSERT';
  defaultContinuePresetId?: number | null;
  defaultPolishPresetId?: number | null;
  defaultExpandPresetId?: number | null;
}

interface ManuscriptContextSettings {
  characters: ContextSettingItem[];
  systems: ContextSettingItem[];
  worlds: ContextSettingItem[];
  misc: ContextSettingItem[];
  recentChapters?: RecentChapterContextItem[];
  projectMemoryItems?: ProjectMemoryContextItem[];
  projectKnowledgeChunks?: ProjectKnowledgeContextItem[];
  aiConfig: ManuscriptContextConfig;
}

export interface ManuscriptAiContextResult {
  settingsContext: string;
  contextSources: AiContextSourceItem[];
}

export interface ManuscriptAiConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  enableCharacterContext: boolean;
  enableSystemContext: boolean;
  enableWorldContext: boolean;
  enableMiscContext: boolean;
  enableChapterSummaryContext: boolean;
  enableProjectMemoryContext: boolean;
  contextLengthStrategy: 'COMPACT' | 'BALANCED' | 'EXPANDED';
  resultApplyStrategy: 'CANDIDATE' | 'DIRECT_INSERT';
  defaultContinuePresetId?: number | null;
  defaultPolishPresetId?: number | null;
  defaultExpandPresetId?: number | null;
}

export interface ManuscriptContextSubject {
  id: number;
  userId: number;
  projectId?: number | null;
  characters: string[];
  systems: string[];
  worlds: string[];
  misc: string[];
}

export interface ManuscriptChapterContextTarget {
  chapterId: number;
  manuscriptId?: number | null;
  volumeId?: number | null;
  sortOrder: Prisma.Decimal | Prisma.DecimalJsLike | string | number;
}

interface RecentChapterContextItem {
  id: number;
  title: string;
  contentPreview: string;
}

interface ProjectMemoryContextItem {
  id: number;
  category: string;
  title: string;
  content: string;
  priority: number;
}

interface ProjectKnowledgeContextItem {
  id: number;
  documentTitle: string;
  documentType: string;
  contentPreview: string;
}

type RecentChapterRecord = Prisma.manuscript_chapterGetPayload<{
  include: { content: true; summary: true };
}>;

type ProjectKnowledgeChunkRecord = Prisma.knowledge_chunksGetPayload<{
  include: {
    document: {
      select: {
        title: true;
        documentType: true;
      };
    };
  };
}>;

export interface LoadedManuscriptAiContext extends ManuscriptAiContextResult {
  characters: ContextSettingItem[];
  systems: ContextSettingItem[];
  worlds: ContextSettingItem[];
  misc: ContextSettingItem[];
  recentChapters: RecentChapterContextItem[];
  projectMemoryItems: ProjectMemoryContextItem[];
  projectKnowledgeChunks: ProjectKnowledgeContextItem[];
  aiConfig: ManuscriptAiConfig;
}

const DEFAULT_MANUSCRIPT_AI_CONFIG: ManuscriptAiConfig = {
  provider: 'openai_compatible',
  model: 'gpt-5.2',
  temperature: 0.6,
  maxTokens: 2000,
  enableCharacterContext: true,
  enableSystemContext: true,
  enableWorldContext: true,
  enableMiscContext: true,
  enableChapterSummaryContext: false,
  enableProjectMemoryContext: false,
  contextLengthStrategy: 'BALANCED',
  resultApplyStrategy: 'CANDIDATE',
  defaultContinuePresetId: null,
  defaultPolishPresetId: null,
  defaultExpandPresetId: null,
};

const EMPTY_CONTEXT_SETTINGS: ContextSettingItem[] = [];

/**
 * 文稿 AI 上下文编排服务
 */
@Injectable()
export class ManuscriptAiContextService {
  constructor(private readonly prisma?: PrismaService) {}

  buildContext(settings: ManuscriptContextSettings): ManuscriptAiContextResult {
    return {
      settingsContext: this.buildSettingsContext(settings),
      contextSources: this.buildContextSources(settings),
    };
  }

  async loadManuscriptContext(
    manuscript: ManuscriptContextSubject,
    userId: number,
    chapterTarget?: ManuscriptChapterContextTarget
  ): Promise<LoadedManuscriptAiContext> {
    if (!this.prisma) {
      throw new Error('PrismaService is required to load manuscript context');
    }

    if (manuscript.projectId) {
      const project = await this.prisma.projects.findFirst({
        where: {
          id: manuscript.projectId,
          userId,
        },
        include: {
          aiConfig: true,
        },
      });

      if (!project) {
        throw new Error(`Project with id ${manuscript.projectId} not found`);
      }

      const aiConfig = this.normalizeManuscriptAiConfig(project.aiConfig);
      const [characters, systems, worlds, misc] = await Promise.all([
        aiConfig.enableCharacterContext
          ? this.getCharactersByIds(project.characters || [], userId)
          : Promise.resolve(EMPTY_CONTEXT_SETTINGS),
        aiConfig.enableSystemContext
          ? this.getSystemsByIds(project.systems || [], userId)
          : Promise.resolve(EMPTY_CONTEXT_SETTINGS),
        aiConfig.enableWorldContext
          ? this.getWorldsByIds(project.worlds || [], userId)
          : Promise.resolve(EMPTY_CONTEXT_SETTINGS),
        aiConfig.enableMiscContext
          ? this.getMiscByIds(project.misc || [], userId)
          : Promise.resolve(EMPTY_CONTEXT_SETTINGS),
      ]);
      const recentChapters =
        aiConfig.enableChapterSummaryContext && chapterTarget
          ? await this.getRecentChapters(chapterTarget, aiConfig.contextLengthStrategy)
          : [];
      const projectMemoryItems = aiConfig.enableProjectMemoryContext
        ? await this.getProjectMemoryItems(manuscript.projectId, aiConfig.contextLengthStrategy)
        : [];
      const projectKnowledgeChunks =
        aiConfig.enableProjectMemoryContext && aiConfig.contextLengthStrategy === 'EXPANDED'
          ? await this.getProjectKnowledgeChunks(manuscript.projectId)
          : [];
      const context = this.buildContext({
        characters,
        systems,
        worlds,
        misc,
        recentChapters,
        projectMemoryItems,
        projectKnowledgeChunks,
        aiConfig,
      });

      return {
        ...context,
        characters,
        systems,
        worlds,
        misc,
        recentChapters,
        projectMemoryItems,
        projectKnowledgeChunks,
        aiConfig,
      };
    }

    const [characters, systems, worlds, misc] = await Promise.all([
      this.getCharactersByIds(manuscript.characters || [], userId),
      this.getSystemsByIds(manuscript.systems || [], userId),
      this.getWorldsByIds(manuscript.worlds || [], userId),
      this.getMiscByIds(manuscript.misc || [], userId),
    ]);
    const recentChapters =
      DEFAULT_MANUSCRIPT_AI_CONFIG.enableChapterSummaryContext && chapterTarget
        ? await this.getRecentChapters(
            chapterTarget,
            DEFAULT_MANUSCRIPT_AI_CONFIG.contextLengthStrategy
          )
        : [];
    const context = this.buildContext({
      characters,
      systems,
      worlds,
      misc,
      recentChapters,
      projectMemoryItems: [],
      projectKnowledgeChunks: [],
      aiConfig: DEFAULT_MANUSCRIPT_AI_CONFIG,
    });

    return {
      ...context,
      characters,
      systems,
      worlds,
      misc,
      recentChapters,
      projectMemoryItems: [],
      projectKnowledgeChunks: [],
      aiConfig: DEFAULT_MANUSCRIPT_AI_CONFIG,
    };
  }

  private normalizeManuscriptAiConfig(config?: project_ai_configs | null): ManuscriptAiConfig {
    if (!config) {
      return DEFAULT_MANUSCRIPT_AI_CONFIG;
    }

    return {
      provider: config.provider as AIProvider,
      model: config.model,
      temperature: Number(config.temperature),
      maxTokens: config.maxTokens,
      enableCharacterContext: config.enableCharacterContext,
      enableSystemContext: config.enableSystemContext,
      enableWorldContext: config.enableWorldContext,
      enableMiscContext: config.enableMiscContext,
      enableChapterSummaryContext: config.enableChapterSummaryContext,
      enableProjectMemoryContext: config.enableProjectMemoryContext,
      contextLengthStrategy: config.contextLengthStrategy,
      resultApplyStrategy: config.resultApplyStrategy,
      defaultContinuePresetId: config.defaultContinuePresetId,
      defaultPolishPresetId: config.defaultPolishPresetId,
      defaultExpandPresetId: config.defaultExpandPresetId,
    };
  }

  private normalizeSettingIds(ids: string[]): number[] {
    return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
  }

  private async getCharactersByIds(ids: string[], userId: number): Promise<ContextSettingItem[]> {
    if (!ids || ids.length === 0 || !this.prisma) return [];
    return this.prisma.character_settings.findMany({
      where: {
        userId,
        id: { in: this.normalizeSettingIds(ids) },
      },
    });
  }

  private async getSystemsByIds(ids: string[], userId: number): Promise<ContextSettingItem[]> {
    if (!ids || ids.length === 0 || !this.prisma) return [];
    return this.prisma.system_settings.findMany({
      where: {
        userId,
        id: { in: this.normalizeSettingIds(ids) },
      },
    });
  }

  private async getWorldsByIds(ids: string[], userId: number): Promise<ContextSettingItem[]> {
    if (!ids || ids.length === 0 || !this.prisma) return [];
    return this.prisma.world_settings.findMany({
      where: {
        userId,
        id: { in: this.normalizeSettingIds(ids) },
      },
    });
  }

  private async getMiscByIds(ids: string[], userId: number): Promise<ContextSettingItem[]> {
    if (!ids || ids.length === 0 || !this.prisma) return [];
    return this.prisma.misc_settings.findMany({
      where: {
        userId,
        id: { in: this.normalizeSettingIds(ids) },
      },
    });
  }

  private getRecentChapterLimit(strategy: ManuscriptAiConfig['contextLengthStrategy']): number {
    switch (strategy) {
      case 'COMPACT':
        return 1;
      case 'EXPANDED':
        return 5;
      case 'BALANCED':
        return 3;
    }
  }

  private getProjectMemoryLimit(strategy: ManuscriptAiConfig['contextLengthStrategy']): number {
    switch (strategy) {
      case 'COMPACT':
        return 4;
      case 'EXPANDED':
        return 12;
      case 'BALANCED':
        return 8;
    }
  }

  private getProjectKnowledgeChunkLimit(): number {
    return 6;
  }

  private createContentPreview(content?: string | null): string {
    if (!content?.trim()) {
      return '暂无正文内容';
    }
    const normalized = content.replace(/\s+/g, ' ').trim();
    return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
  }

  private async getRecentChapters(
    chapterTarget: ManuscriptChapterContextTarget,
    strategy: ManuscriptAiConfig['contextLengthStrategy']
  ): Promise<RecentChapterContextItem[]> {
    if (!this.prisma) return [];

    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        manuscriptId: chapterTarget.manuscriptId ?? null,
        volumeId: chapterTarget.volumeId ?? null,
        sortOrder: { lt: chapterTarget.sortOrder },
      },
      include: { content: true, summary: true },
      orderBy: { sortOrder: 'desc' },
      take: this.getRecentChapterLimit(strategy),
    });

    return chapters.map((chapter: RecentChapterRecord) => ({
      id: chapter.id,
      title: chapter.title,
      contentPreview: this.createContentPreview(
        chapter.summary?.summary ?? chapter.content?.content
      ),
    }));
  }

  private async getProjectMemoryItems(
    projectId: number,
    strategy: ManuscriptAiConfig['contextLengthStrategy']
  ): Promise<ProjectMemoryContextItem[]> {
    if (!this.prisma) return [];

    return this.prisma.project_memory_items.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: this.getProjectMemoryLimit(strategy),
    });
  }

  private async getProjectKnowledgeChunks(
    projectId: number
  ): Promise<ProjectKnowledgeContextItem[]> {
    if (!this.prisma) return [];

    const chunks = await this.prisma.knowledge_chunks.findMany({
      where: {
        projectId,
        document: {
          status: 'ACTIVE',
        },
      },
      include: {
        document: {
          select: {
            title: true,
            documentType: true,
          },
        },
      },
      orderBy: [{ documentId: 'desc' }, { chunkIndex: 'asc' }],
      take: this.getProjectKnowledgeChunkLimit(),
    });

    return chunks.map((chunk: ProjectKnowledgeChunkRecord) => {
      const summaryPrefix = chunk.summary?.trim() ? `${chunk.summary.trim()}；` : '';

      return {
        id: chunk.id,
        documentTitle: chunk.document.title,
        documentType: chunk.document.documentType,
        contentPreview: this.createContentPreview(`${summaryPrefix}${chunk.content}`),
      };
    });
  }

  private buildSettingsContext(settings: ManuscriptContextSettings): string {
    const parts: string[] = [];
    const getOptionalString = (value: unknown): string | undefined => {
      return typeof value === 'string' && value.trim() ? value : undefined;
    };

    if (settings.characters.length > 0) {
      parts.push('## 角色设定');
      settings.characters.forEach((character) => {
        const summary =
          getOptionalString(character.background) ??
          getOptionalString(character.personality) ??
          '暂无背景描述';
        parts.push(`- ${character.name}: ${summary}`);
      });
    }

    if (settings.systems.length > 0) {
      parts.push('## 系统设定');
      settings.systems.forEach((system) => {
        parts.push(`- ${system.name}: ${system.description || '暂无描述'}`);
      });
    }

    if (settings.worlds.length > 0) {
      parts.push('## 世界设定');
      settings.worlds.forEach((world) => {
        parts.push(`- ${world.name}: ${world.description || '暂无描述'}`);
      });
    }

    if (settings.misc.length > 0) {
      parts.push('## 辅助设定');
      settings.misc.forEach((misc) => {
        parts.push(`- ${misc.name}: ${misc.description || '暂无描述'}`);
      });
    }

    if (settings.recentChapters?.length) {
      parts.push('## 近期章节');
      settings.recentChapters.forEach((chapter) => {
        parts.push(`- ${chapter.title}: ${chapter.contentPreview}`);
      });
    }

    if (settings.projectMemoryItems?.length) {
      parts.push('## 项目记忆');
      settings.projectMemoryItems.forEach((item) => {
        parts.push(`- [${item.category}] ${item.title}: ${item.content}`);
      });
    }

    if (settings.projectKnowledgeChunks?.length) {
      parts.push('## 项目资料');
      settings.projectKnowledgeChunks.forEach((chunk) => {
        parts.push(`- [${chunk.documentType}] ${chunk.documentTitle}: ${chunk.contentPreview}`);
      });
    }

    return parts.length > 0 ? parts.join('\n') : '暂无关联设定，请根据已有内容自由发挥。';
  }

  private buildContextSources(settings: ManuscriptContextSettings): AiContextSourceItem[] {
    return [
      {
        sourceType: 'CHARACTER',
        sourceId: null,
        sourceName: '角色',
        included: settings.aiConfig.enableCharacterContext,
        reason: settings.aiConfig.enableCharacterContext
          ? '项目配置启用角色上下文'
          : '项目配置关闭角色上下文',
        contentPreview: `${settings.characters.length} 项`,
      },
      {
        sourceType: 'SYSTEM',
        sourceId: null,
        sourceName: '系统',
        included: settings.aiConfig.enableSystemContext,
        reason: settings.aiConfig.enableSystemContext
          ? '项目配置启用系统上下文'
          : '项目配置关闭系统上下文',
        contentPreview: `${settings.systems.length} 项`,
      },
      {
        sourceType: 'WORLD',
        sourceId: null,
        sourceName: '世界',
        included: settings.aiConfig.enableWorldContext,
        reason: settings.aiConfig.enableWorldContext
          ? '项目配置启用世界上下文'
          : '项目配置关闭世界上下文',
        contentPreview: `${settings.worlds.length} 项`,
      },
      {
        sourceType: 'MISC',
        sourceId: null,
        sourceName: '辅助',
        included: settings.aiConfig.enableMiscContext,
        reason: settings.aiConfig.enableMiscContext
          ? '项目配置启用辅助上下文'
          : '项目配置关闭辅助上下文',
        contentPreview: `${settings.misc.length} 项`,
      },
      {
        sourceType: 'RECENT_CHAPTER',
        sourceId: null,
        sourceName: '近期章节',
        included: Boolean(settings.aiConfig.enableChapterSummaryContext),
        reason: settings.aiConfig.enableChapterSummaryContext
          ? '项目配置启用章节摘要上下文'
          : '项目配置关闭章节摘要上下文',
        contentPreview: `${settings.recentChapters?.length ?? 0} 章`,
      },
      {
        sourceType: 'PROJECT_MEMORY',
        sourceId: null,
        sourceName: '项目记忆',
        included: Boolean(settings.aiConfig.enableProjectMemoryContext),
        reason: settings.aiConfig.enableProjectMemoryContext
          ? '项目配置启用项目记忆上下文'
          : '项目配置关闭项目记忆上下文',
        contentPreview: `${settings.projectMemoryItems?.length ?? 0} 条`,
      },
      {
        sourceType: 'PROJECT_KNOWLEDGE',
        sourceId: null,
        sourceName: '项目资料',
        included: Boolean(
          settings.aiConfig.enableProjectMemoryContext &&
            settings.aiConfig.contextLengthStrategy === 'EXPANDED'
        ),
        reason:
          settings.aiConfig.enableProjectMemoryContext &&
          settings.aiConfig.contextLengthStrategy === 'EXPANDED'
            ? '项目配置启用项目记忆且上下文策略为扩展'
            : '仅扩展上下文策略会引用项目资料',
        contentPreview: `${settings.projectKnowledgeChunks?.length ?? 0} 段`,
      },
    ];
  }
}
