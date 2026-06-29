import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateManuscriptDto,
  UpdateManuscriptDto,
  CreateVolumeDto,
  UpdateVolumeDto,
  CreateChapterDto,
  UpdateChapterDto,
  SaveChapterContentDto,
  SaveChapterSummaryDto,
  ApplyAiCandidateDto,
  ManuscriptAiOverrideConfigDto,
} from './manuscripts.dto';
import { Decimal } from '@prisma/client/runtime/library';
import type { AIModelRuntimeConfig } from '../ai/ai.service';
import { AIService } from '../ai/ai.service';
import { AiJobsService } from '../ai-jobs/ai-jobs.service';
import {
  ManuscriptAiContextService,
  type ManuscriptAiConfig,
} from './manuscript-ai-context.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  AiCandidateApplyStatus,
  AiCandidateApplyMode,
  AiCandidateType,
  AiJobStatus,
  AiTaskType,
  Prisma,
  type ai_generation_candidates,
  type ai_generation_records,
} from '../../generated/prisma';
import type {
  AiContextSourceItem,
  AiEffectiveConfig,
  AiGenerationCandidate,
  AiGenerationRecord,
  AiGenerationResponse,
  AiTaskType as SharedAiTaskType,
} from '@moge/types';
import {
  buildRecentDateKeys,
  buildWritingDeltaEvents,
  countWrittenWords,
  getDateKeyInTimeZone,
} from '../common/writing-stats.util';

type ManuscriptDbClient = PrismaService | Prisma.TransactionClient;

interface TransactionLock {
  namespace: number;
  scopeId: number;
}

const MANUSCRIPT_LOCK_NAMESPACE = 1001;
const MANUSCRIPT_VOLUME_LOCK_NAMESPACE = 1002;

interface ManuscriptPromptInput {
  settingsContext: string;
  currentContent: string;
  sourceText?: string;
  customPrompt?: string;
}

interface ManuscriptPromptDefinition {
  systemPrompt: string;
  userPromptTemplate: string;
}

interface ResolvedPromptPreset {
  presetId: number | null;
  presetVersion: number | null;
  systemPrompt: string;
  userPrompt: string;
}

type ManuscriptAiTaskOverrideConfig = ManuscriptAiOverrideConfigDto;

interface ChapterForSummaryJob {
  id: number;
  manuscriptId?: number | null;
  manuscript?: { id: number; userId: number; projectId?: number | null } | null;
  volume?: { manuscript?: { id: number; userId: number; projectId?: number | null } | null } | null;
  content?: { content?: string | null; version: number } | null;
}

type ChapterSummaryJobTrigger = 'MANUAL' | 'CONTENT_SAVED' | 'PUBLISHED';

const ACTIVE_CHAPTER_SUMMARY_JOB_STATUSES = [
  AiJobStatus.PENDING,
  AiJobStatus.QUEUED,
  AiJobStatus.RUNNING,
];

/**
 * 文稿服务
 */
@Injectable()
export class ManuscriptsService {
  private readonly logger = new Logger(ManuscriptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly aiJobsService?: AiJobsService,
    private readonly aiContextService = new ManuscriptAiContextService(prisma)
  ) {}

  /**
   * 文稿详情统一只返回无卷直连章节，避免与卷内章节重复
   */
  private getManuscriptInclude() {
    return {
      volumes: {
        include: {
          chapters: {
            orderBy: { sortOrder: 'asc' as const },
          },
        },
        orderBy: { sortOrder: 'asc' as const },
      },
      chapters: {
        where: { volumeId: null },
        orderBy: { sortOrder: 'asc' as const },
      },
    };
  }

  private getManuscriptLock(manuscriptId: number): TransactionLock {
    return {
      namespace: MANUSCRIPT_LOCK_NAMESPACE,
      scopeId: manuscriptId,
    };
  }

  private getVolumeLock(volumeId: number): TransactionLock {
    return {
      namespace: MANUSCRIPT_VOLUME_LOCK_NAMESPACE,
      scopeId: volumeId,
    };
  }

  private toAiModelRuntimeConfig(config: ManuscriptAiConfig): AIModelRuntimeConfig {
    return {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };
  }

  private toEffectiveConfig(
    config: ManuscriptAiConfig,
    taskType: SharedAiTaskType
  ): AiEffectiveConfig {
    return {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      contextLengthStrategy: config.contextLengthStrategy,
      resultApplyStrategy: config.resultApplyStrategy,
      defaultPresetId: this.getDefaultPresetId(config, taskType),
    };
  }

  private applyOneOffAiOverride(
    config: ManuscriptAiConfig,
    taskType: SharedAiTaskType,
    overrideConfig?: ManuscriptAiTaskOverrideConfig
  ): ManuscriptAiConfig {
    if (!overrideConfig) {
      return config;
    }

    const mergedConfig: ManuscriptAiConfig = {
      ...config,
      ...(overrideConfig.provider !== undefined ? { provider: overrideConfig.provider } : {}),
      ...(overrideConfig.model !== undefined ? { model: overrideConfig.model } : {}),
      ...(overrideConfig.temperature !== undefined
        ? { temperature: overrideConfig.temperature }
        : {}),
      ...(overrideConfig.maxTokens !== undefined ? { maxTokens: overrideConfig.maxTokens } : {}),
      ...(overrideConfig.contextLengthStrategy !== undefined
        ? { contextLengthStrategy: overrideConfig.contextLengthStrategy }
        : {}),
    };

    if (overrideConfig.defaultPresetId !== undefined) {
      if (taskType === AiTaskType.MANUSCRIPT_CONTINUE) {
        mergedConfig.defaultContinuePresetId = overrideConfig.defaultPresetId;
      } else if (taskType === AiTaskType.MANUSCRIPT_POLISH) {
        mergedConfig.defaultPolishPresetId = overrideConfig.defaultPresetId;
      } else if (taskType === AiTaskType.MANUSCRIPT_EXPAND) {
        mergedConfig.defaultExpandPresetId = overrideConfig.defaultPresetId;
      }
    }

    return mergedConfig;
  }

  private serializeAiOverrideConfig(
    overrideConfig?: ManuscriptAiTaskOverrideConfig
  ): Prisma.InputJsonObject | null {
    if (!overrideConfig) {
      return null;
    }

    return {
      ...(overrideConfig.provider !== undefined ? { provider: overrideConfig.provider } : {}),
      ...(overrideConfig.model !== undefined ? { model: overrideConfig.model } : {}),
      ...(overrideConfig.temperature !== undefined
        ? { temperature: overrideConfig.temperature }
        : {}),
      ...(overrideConfig.maxTokens !== undefined ? { maxTokens: overrideConfig.maxTokens } : {}),
      ...(overrideConfig.contextLengthStrategy !== undefined
        ? { contextLengthStrategy: overrideConfig.contextLengthStrategy }
        : {}),
      ...(overrideConfig.defaultPresetId !== undefined
        ? { defaultPresetId: overrideConfig.defaultPresetId }
        : {}),
    };
  }

  private getDefaultPresetId(
    config: ManuscriptAiConfig,
    taskType: SharedAiTaskType
  ): number | null {
    switch (taskType) {
      case 'MANUSCRIPT_CONTINUE':
        return config.defaultContinuePresetId ?? null;
      case 'MANUSCRIPT_POLISH':
        return config.defaultPolishPresetId ?? null;
      case 'MANUSCRIPT_EXPAND':
        return config.defaultExpandPresetId ?? null;
    }
  }

  private buildAppliedCandidateContent(params: {
    mode: AiCandidateApplyMode;
    existingContent: string;
    candidateContent: string;
    selectedText?: string;
  }): string {
    if (
      params.mode === AiCandidateApplyMode.OVERWRITE_DRAFT ||
      params.mode === AiCandidateApplyMode.SAVE_AS_DRAFT
    ) {
      return params.candidateContent;
    }

    if (params.mode === AiCandidateApplyMode.REPLACE_SELECTION) {
      const selectedText = params.selectedText?.trim();
      if (!selectedText) {
        throw new BadRequestException('替换选区时必须提供选中文本');
      }

      if (!params.existingContent.includes(selectedText)) {
        throw new BadRequestException('选中文本已变化，请重新选择后再采纳');
      }

      return params.existingContent.replace(selectedText, params.candidateContent);
    }

    return params.existingContent
      ? `${params.existingContent.trimEnd()}\n\n${params.candidateContent}`
      : params.candidateContent;
  }

  private getSystemDefaultPresetCode(taskType: AiTaskType): string {
    switch (taskType) {
      case AiTaskType.MANUSCRIPT_CONTINUE:
        return 'system_manuscript_continue_default';
      case AiTaskType.MANUSCRIPT_POLISH:
        return 'system_manuscript_polish_default';
      case AiTaskType.MANUSCRIPT_EXPAND:
        return 'system_manuscript_expand_default';
    }
  }

  private renderPromptTemplate(
    template: string,
    input: ManuscriptPromptInput & { taskType: string }
  ) {
    const values: Record<string, string> = {
      settingsContext: input.settingsContext,
      currentContent: input.currentContent,
      sourceText: input.sourceText ?? '',
      customPrompt: input.customPrompt ?? '',
      taskType: input.taskType,
    };

    const withConditionals = template.replace(
      /\{\{#([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
      (_match, key: string, content: string) => (values[key]?.trim() ? content : '')
    );

    return withConditionals.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
      return values[key] ?? '';
    });
  }

  private async resolvePromptPreset(params: {
    taskType: AiTaskType;
    aiConfig: ManuscriptAiConfig;
    userId: number;
    projectId?: number | null;
    fallback: ManuscriptPromptDefinition;
    input: ManuscriptPromptInput;
  }): Promise<ResolvedPromptPreset> {
    const promptDelegate = this.prisma.ai_prompt_presets;
    if (!promptDelegate) {
      return {
        presetId: null,
        presetVersion: null,
        systemPrompt: params.fallback.systemPrompt,
        userPrompt: this.renderPromptTemplate(params.fallback.userPromptTemplate, {
          ...params.input,
          taskType: params.taskType,
        }),
      };
    }

    const defaultPresetId = this.getDefaultPresetId(params.aiConfig, params.taskType);
    const preset = await promptDelegate.findFirst({
      where: defaultPresetId
        ? {
            id: defaultPresetId,
            taskType: params.taskType,
            isEnabled: true,
            OR: [
              { scope: 'SYSTEM' },
              { scope: 'USER', createdBy: params.userId },
              { scope: 'PROJECT', projectId: params.projectId ?? null },
            ],
          }
        : {
            code: this.getSystemDefaultPresetCode(params.taskType),
            taskType: params.taskType,
            scope: 'SYSTEM',
            isEnabled: true,
          },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    const version = preset?.versions[0];

    if (!preset || !version) {
      return {
        presetId: null,
        presetVersion: null,
        systemPrompt: params.fallback.systemPrompt,
        userPrompt: this.renderPromptTemplate(params.fallback.userPromptTemplate, {
          ...params.input,
          taskType: params.taskType,
        }),
      };
    }

    return {
      presetId: preset.id,
      presetVersion: version.version,
      systemPrompt: this.renderPromptTemplate(version.systemPrompt, {
        ...params.input,
        taskType: params.taskType,
      }),
      userPrompt: this.renderPromptTemplate(version.userPromptTemplate, {
        ...params.input,
        taskType: params.taskType,
      }),
    };
  }

  private toIsoString(value?: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    return value instanceof Date ? value.toISOString() : value;
  }

  private serializeGenerationRecord(record: ai_generation_records): AiGenerationRecord {
    return {
      id: record.id,
      jobId: record.jobId,
      projectId: record.projectId,
      taskType: record.taskType,
      provider: record.provider,
      model: record.model,
      presetId: record.presetId,
      presetVersion: record.presetVersion,
      requestPayload: record.requestPayload,
      contextSnapshot: record.contextSnapshot,
      outputText: record.outputText,
      tokenUsage: record.tokenUsage,
      latencyMs: record.latencyMs,
      status: record.status,
      errorMessage: record.errorMessage,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private serializeGenerationCandidate(candidate: ai_generation_candidates): AiGenerationCandidate {
    return {
      id: candidate.id,
      generationRecordId: candidate.generationRecordId,
      projectId: candidate.projectId,
      outlineId: candidate.outlineId,
      manuscriptId: candidate.manuscriptId,
      chapterId: candidate.chapterId,
      candidateType: candidate.candidateType,
      targetType: candidate.targetType,
      targetId: candidate.targetId,
      targetContentVersion: candidate.targetContentVersion,
      expectedContentHash: candidate.expectedContentHash,
      content: candidate.content,
      diffMeta: candidate.diffMeta,
      applyStatus: candidate.applyStatus,
      appliedBy: candidate.appliedBy,
      appliedAt: this.toIsoString(candidate.appliedAt),
      applyMode: candidate.applyMode,
      appliedContentVersion: candidate.appliedContentVersion,
      createdAt: candidate.createdAt.toISOString(),
    };
  }

  private async acquireTransactionLocks(
    tx: Prisma.TransactionClient,
    locks: TransactionLock[]
  ): Promise<void> {
    const uniqueLocks = Array.from(
      new Map(locks.map((lock) => [`${lock.namespace}:${lock.scopeId}`, lock])).values()
    ).sort((left, right) => {
      if (left.namespace !== right.namespace) {
        return left.namespace - right.namespace;
      }

      return left.scopeId - right.scopeId;
    });

    for (const lock of uniqueLocks) {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(CAST(${lock.namespace} AS integer), CAST(${lock.scopeId} AS integer))`
      );
    }
  }

  private async runLockedTransaction<T>(
    locks: TransactionLock[],
    operation: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await this.acquireTransactionLocks(tx, locks);
      return operation(tx);
    });
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

  private normalizeStoredSettingIds(ids?: string[]): string[] | undefined {
    if (ids === undefined) {
      return undefined;
    }

    const normalizedIds = ids.map((id) => {
      const normalizedId = String(id).trim();

      if (!/^\d+$/.test(normalizedId)) {
        throw new BadRequestException('设定 ID 格式不正确');
      }

      return String(Number(normalizedId));
    });

    return Array.from(new Set(normalizedIds));
  }

  private async assertProjectOwned(userId: number, projectId?: number) {
    if (projectId === undefined) {
      return;
    }

    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    if (!project) {
      throw new BadRequestException('项目不存在或无权限访问');
    }
  }

  private async assertOutlineOwned(userId: number, outlineId?: number) {
    if (outlineId === undefined) {
      return;
    }

    const outline = await this.prisma.outline.findFirst({
      where: {
        id: outlineId,
        userId,
      },
      select: { id: true },
    });

    if (!outline) {
      throw new BadRequestException('大纲不存在或无权限访问');
    }
  }

  private async assertCharactersOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.character_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分角色设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertSystemsOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.system_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分系统设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertWorldsOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.world_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分世界设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertMiscOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.misc_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分辅助设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async validateManuscriptAssociations(
    userId: number,
    data: {
      outlineId?: number;
      projectId?: number;
      characters?: string[];
      systems?: string[];
      worlds?: string[];
      misc?: string[];
    }
  ) {
    await Promise.all([
      this.assertOutlineOwned(userId, data.outlineId),
      this.assertProjectOwned(userId, data.projectId),
    ]);

    const [characters, systems, worlds, misc] = await Promise.all([
      this.assertCharactersOwned(userId, data.characters),
      this.assertSystemsOwned(userId, data.systems),
      this.assertWorldsOwned(userId, data.worlds),
      this.assertMiscOwned(userId, data.misc),
    ]);

    return { characters, systems, worlds, misc };
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

  private async getChapterWithManuscript(
    prismaClient: ManuscriptDbClient,
    chapterId: number,
    includeContent = false
  ) {
    return prismaClient.manuscript_chapter.findUnique({
      where: { id: chapterId },
      include: {
        manuscript: true,
        volume: { include: { manuscript: true } },
        content: includeContent,
      },
    });
  }

  /**
   * 创建文稿
   */
  async createManuscript(userId: number, dto: CreateManuscriptDto) {
    const relations = await this.validateManuscriptAssociations(userId, dto);

    return this.prisma.manuscripts.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        tags: dto.tags ?? [],
        outlineId: dto.outlineId,
        projectId: dto.projectId,
        characters: relations.characters ?? [],
        systems: relations.systems ?? [],
        worlds: relations.worlds ?? [],
        misc: relations.misc ?? [],
        targetWords: dto.targetWords,
        coverUrl: dto.coverUrl,
        userId,
      },
      include: this.getManuscriptInclude(),
    });
  }

  /**
   * 从大纲创建文稿
   */
  async createManuscriptFromOutline(userId: number, dto: CreateManuscriptDto) {
    const outlineId = dto.outlineId;

    if (!outlineId) {
      throw new BadRequestException('outlineId is required');
    }

    // 获取大纲信息
    const outline = await this.prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        volumes: {
          include: {
            chapters: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        chapters: {
          where: { volumeId: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!outline) {
      throw new NotFoundException(`Outline with id ${outlineId} not found`);
    }

    if (outline.userId !== userId) {
      throw new ForbiddenException('无权访问该大纲');
    }
    const relations = await this.validateManuscriptAssociations(userId, {
      projectId: dto.projectId,
      characters: dto.characters ?? outline.characters,
      systems: dto.systems ?? outline.systems,
      worlds: dto.worlds ?? outline.worlds,
      misc: dto.misc ?? outline.misc,
    });

    const manuscriptId = await this.prisma.$transaction(async (tx) => {
      const manuscript = await tx.manuscripts.create({
        data: {
          name: dto.name,
          description: dto.description?.trim() || `根据大纲《${outline.name}》创建`,
          type: dto.type ?? outline.type,
          tags: dto.tags ?? outline.tags,
          outlineId: outline.id,
          userId,
          projectId: dto.projectId,
          characters: relations.characters ?? [],
          systems: relations.systems ?? [],
          worlds: relations.worlds ?? [],
          misc: relations.misc ?? [],
          targetWords: dto.targetWords,
          coverUrl: dto.coverUrl,
        },
      });

      for (const outlineVolume of outline.volumes) {
        const volume = await tx.manuscript_volume.create({
          data: {
            manuscriptId: manuscript.id,
            title: outlineVolume.title,
            description: outlineVolume.description,
            sortOrder: outlineVolume.sortOrder,
          },
        });

        for (const outlineChapter of outlineVolume.chapters) {
          await tx.manuscript_chapter.create({
            data: {
              volumeId: volume.id,
              title: outlineChapter.title,
              sortOrder: outlineChapter.sortOrder,
            },
          });
        }
      }

      for (const outlineChapter of outline.chapters) {
        await tx.manuscript_chapter.create({
          data: {
            manuscriptId: manuscript.id,
            title: outlineChapter.title,
            sortOrder: outlineChapter.sortOrder,
          },
        });
      }

      return manuscript.id;
    });

    return this.findOne(manuscriptId, userId);
  }

  /**
   * 获取用户的所有文稿列表（未删除）
   */
  async findAll(userId: number) {
    return this.prisma.manuscripts.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: this.getManuscriptInclude(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * 获取单个文稿详情
   */
  async findOne(id: number, userId: number) {
    const manuscript = await this.prisma.manuscripts.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: this.getManuscriptInclude(),
    });

    if (!manuscript) {
      throw new NotFoundException(`Manuscript with id ${id} not found`);
    }

    return manuscript;
  }

  /**
   * 更新文稿
   */
  async updateManuscript(id: number, userId: number, dto: UpdateManuscriptDto) {
    await this.findOne(id, userId);
    const relations = await this.validateManuscriptAssociations(userId, dto);
    const updateData: Partial<UpdateManuscriptDto> & {
      characters?: string[];
      systems?: string[];
      worlds?: string[];
      misc?: string[];
    } = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }
    if (dto.tags !== undefined) {
      updateData.tags = dto.tags;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }
    if (dto.projectId !== undefined) {
      updateData.projectId = dto.projectId;
    }
    if (relations.characters !== undefined) {
      updateData.characters = relations.characters;
    }
    if (relations.systems !== undefined) {
      updateData.systems = relations.systems;
    }
    if (relations.worlds !== undefined) {
      updateData.worlds = relations.worlds;
    }
    if (relations.misc !== undefined) {
      updateData.misc = relations.misc;
    }
    if (dto.targetWords !== undefined) {
      updateData.targetWords = dto.targetWords;
    }
    if (dto.coverUrl !== undefined) {
      updateData.coverUrl = dto.coverUrl;
    }

    return this.prisma.manuscripts.update({
      where: { id },
      data: updateData,
      include: this.getManuscriptInclude(),
    });
  }

  /**
   * 软删除文稿
   */
  async deleteManuscript(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.manuscripts.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 创建卷
   */
  async createVolume(dto: CreateVolumeDto, userId: number) {
    // 验证文稿权限
    await this.findOne(dto.manuscriptId, userId);

    return this.runLockedTransaction([this.getManuscriptLock(dto.manuscriptId)], async (tx) => {
      const lastVolume = await tx.manuscript_volume.findFirst({
        where: { manuscriptId: dto.manuscriptId },
        orderBy: { sortOrder: 'desc' },
      });

      const sortOrder = lastVolume
        ? new Decimal(lastVolume.sortOrder.toString()).plus(1)
        : new Decimal(1);

      return tx.manuscript_volume.create({
        data: {
          manuscriptId: dto.manuscriptId,
          title: dto.title,
          description: dto.description,
          sortOrder,
        },
        include: {
          chapters: true,
        },
      });
    });
  }

  /**
   * 更新卷
   */
  async updateVolume(volumeId: number, dto: UpdateVolumeDto, userId: number) {
    const volume = await this.prisma.manuscript_volume.findUnique({
      where: { id: volumeId },
      include: { manuscript: true },
    });

    if (!volume) {
      throw new NotFoundException(`Volume with id ${volumeId} not found`);
    }

    if (volume.manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该卷');
    }

    return this.prisma.manuscript_volume.update({
      where: { id: volumeId },
      data: dto,
      include: {
        chapters: true,
      },
    });
  }

  /**
   * 删除卷
   */
  async deleteVolume(volumeId: number, userId: number) {
    const volume = await this.prisma.manuscript_volume.findUnique({
      where: { id: volumeId },
      include: { manuscript: true },
    });

    if (!volume) {
      throw new NotFoundException(`Volume with id ${volumeId} not found`);
    }

    if (volume.manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该卷');
    }

    return this.runLockedTransaction([this.getManuscriptLock(volume.manuscript.id)], async (tx) => {
      const deletedVolume = await tx.manuscript_volume.delete({
        where: { id: volumeId },
      });

      await this.recalculateManuscriptTotalWords(volume.manuscript.id, tx);

      return deletedVolume;
    });
  }

  /**
   * 创建章节
   */
  async createChapter(dto: CreateChapterDto, userId: number) {
    const hasManuscriptId = dto.manuscriptId !== undefined;
    const hasVolumeId = dto.volumeId !== undefined;

    if (hasManuscriptId === hasVolumeId) {
      throw new BadRequestException('manuscriptId 和 volumeId 必须且只能传一个');
    }

    let locks: TransactionLock[];

    // 验证权限
    if (hasManuscriptId) {
      await this.findOne(dto.manuscriptId, userId);
      locks = [this.getManuscriptLock(dto.manuscriptId)];
    } else if (hasVolumeId) {
      const volume = await this.prisma.manuscript_volume.findUnique({
        where: { id: dto.volumeId },
        include: { manuscript: true },
      });

      if (!volume) {
        throw new NotFoundException(`Volume with id ${dto.volumeId} not found`);
      }

      if (volume.manuscript.userId !== userId) {
        throw new ForbiddenException('无权访问该卷');
      }

      locks = [this.getVolumeLock(dto.volumeId)];
    } else {
      throw new BadRequestException('Either manuscriptId or volumeId must be provided');
    }

    return this.runLockedTransaction(locks, async (tx) => {
      const lastChapter = await tx.manuscript_chapter.findFirst({
        where: dto.manuscriptId
          ? { manuscriptId: dto.manuscriptId, volumeId: null }
          : { volumeId: dto.volumeId },
        orderBy: { sortOrder: 'desc' },
      });

      const sortOrder = lastChapter
        ? new Decimal(lastChapter.sortOrder.toString()).plus(1)
        : new Decimal(1);

      return tx.manuscript_chapter.create({
        data: {
          manuscriptId: hasManuscriptId ? dto.manuscriptId : undefined,
          volumeId: hasVolumeId ? dto.volumeId : undefined,
          title: dto.title,
          sortOrder,
        },
      });
    });
  }

  /**
   * 更新章节
   */
  async updateChapter(chapterId: number, dto: UpdateChapterDto, userId: number) {
    const chapter = await this.prisma.manuscript_chapter.findUnique({
      where: { id: chapterId },
      include: {
        manuscript: true,
        volume: { include: { manuscript: true } },
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    return this.prisma.manuscript_chapter.update({
      where: { id: chapterId },
      data: dto,
    });
  }

  /**
   * 删除章节
   */
  async deleteChapter(chapterId: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    await this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      await tx.manuscript_chapter.delete({
        where: { id: chapterId },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);
    });
  }

  /**
   * 获取章节内容
   */
  async getChapterContent(chapterId: number, userId: number) {
    const chapter = await this.prisma.manuscript_chapter.findUnique({
      where: { id: chapterId },
      include: {
        manuscript: true,
        volume: { include: { manuscript: true } },
        content: true,
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    return chapter.content;
  }

  /**
   * 保存章节内容
   */
  async saveChapterContent(chapterId: number, dto: SaveChapterContentDto, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId, true);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    await this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      const currentChapter = await this.getChapterWithManuscript(tx, chapterId, true);

      if (!currentChapter) {
        throw new NotFoundException(`Chapter with id ${chapterId} not found`);
      }

      const currentWordCount = this.calculateWordCount(dto.content);

      if (currentChapter.content) {
        await tx.manuscript_chapter_content_version.create({
          data: {
            contentId: currentChapter.content.id,
            version: currentChapter.content.version,
            content: currentChapter.content.content,
          },
        });

        await tx.manuscript_chapter_content.update({
          where: { chapterId },
          data: {
            content: dto.content,
            version: currentChapter.content.version + 1,
          },
        });
      } else {
        await tx.manuscript_chapter_content.create({
          data: {
            chapterId,
            content: dto.content,
            version: 1,
          },
        });
      }

      await tx.manuscript_chapter.update({
        where: { id: chapterId },
        data: { wordCount: currentWordCount },
      });

      await tx.manuscripts.update({
        where: { id: manuscript.id },
        data: {
          lastEditedChapterId: chapterId,
          lastEditedAt: new Date(),
        },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);
    });

    await this.createChapterSummaryJobIfNeeded(chapterId, userId, 'CONTENT_SAVED');

    return this.getChapterContent(chapterId, userId);
  }

  /**
   * 获取章节摘要
   */
  async getChapterSummary(chapterId: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId, true);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    return this.prisma.chapter_summaries.findUnique({
      where: { chapterId },
    });
  }

  /**
   * 保存章节摘要
   */
  async saveChapterSummary(chapterId: number, dto: SaveChapterSummaryDto, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId, true);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    const summary = dto.summary.trim();
    if (!summary) {
      throw new BadRequestException('章节摘要不能为空');
    }

    return this.prisma.chapter_summaries.upsert({
      where: { chapterId },
      create: {
        chapterId,
        projectId: manuscript.projectId,
        summary,
        summaryType: 'MANUAL',
        sourceVersion: chapter.content?.version ?? null,
        generatedBy: userId,
      },
      update: {
        projectId: manuscript.projectId,
        summary,
        summaryType: 'MANUAL',
        sourceVersion: chapter.content?.version ?? null,
        generatedBy: userId,
      },
    });
  }

  /**
   * 创建章节摘要 AI 任务
   */
  async createChapterSummaryJob(chapterId: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId, true);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    if (!chapter.content?.content?.trim()) {
      throw new BadRequestException('章节正文为空，无法生成摘要');
    }

    return this.createChapterSummaryJobForChapter(chapter, userId, 'MANUAL', 0);
  }

  private async createChapterSummaryJobForChapter(
    chapter: ChapterForSummaryJob,
    userId: number,
    trigger: ChapterSummaryJobTrigger,
    priority: number
  ) {
    if (!this.aiJobsService) {
      throw new BadRequestException('AI 任务服务未启用');
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript) {
      throw new BadRequestException('章节缺少所属文稿，无法生成摘要');
    }

    if (!chapter.content?.content?.trim()) {
      throw new BadRequestException('章节正文为空，无法生成摘要');
    }

    return this.aiJobsService.createJob(userId, {
      taskType: AiTaskType.CHAPTER_SUMMARIZE,
      projectId: manuscript.projectId,
      manuscriptId: manuscript.id,
      chapterId: chapter.id,
      priority,
      inputPayload: {
        sourceVersion: chapter.content.version,
      },
      contextMeta: {
        trigger,
      },
    });
  }

  private async shouldCreateAutomaticChapterSummaryJob(chapter: ChapterForSummaryJob) {
    if (!this.aiJobsService) {
      return false;
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    const contentVersion = chapter.content?.version;
    const projectId = manuscript?.projectId;

    if (!manuscript || !projectId || !contentVersion || !chapter.content?.content?.trim()) {
      return false;
    }

    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        userId: manuscript.userId,
      },
      select: {
        aiConfig: {
          select: {
            enableChapterSummaryContext: true,
          },
        },
      },
    });

    if (!project?.aiConfig?.enableChapterSummaryContext) {
      return false;
    }

    const existingSummary = await this.prisma.chapter_summaries.findUnique({
      where: { chapterId: chapter.id },
      select: { sourceVersion: true },
    });

    if (existingSummary?.sourceVersion === contentVersion) {
      return false;
    }

    const activeJob = await this.prisma.ai_jobs.findFirst({
      where: {
        chapterId: chapter.id,
        taskType: AiTaskType.CHAPTER_SUMMARIZE,
        status: { in: ACTIVE_CHAPTER_SUMMARY_JOB_STATUSES },
      },
      select: { id: true },
    });

    return !activeJob;
  }

  private async createChapterSummaryJobIfNeeded(
    chapterId: number,
    userId: number,
    trigger: Exclude<ChapterSummaryJobTrigger, 'MANUAL'>
  ) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId, true);

    if (!chapter) {
      return;
    }

    if (!(await this.shouldCreateAutomaticChapterSummaryJob(chapter))) {
      return;
    }

    await this.createChapterSummaryJobForChapter(chapter, userId, trigger, -1);
  }

  /**
   * 发布章节
   */
  async publishChapter(chapterId: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    const publishedChapter = await this.runLockedTransaction(
      [this.getManuscriptLock(manuscript.id)],
      async (tx) => {
        const currentChapter = await this.getChapterWithManuscript(tx, chapterId);

        if (!currentChapter) {
          throw new NotFoundException(`Chapter with id ${chapterId} not found`);
        }

        const updatedChapter = await tx.manuscript_chapter.update({
          where: { id: chapterId },
          data: {
            status: 'PUBLISHED',
            publishedAt: currentChapter.publishedAt || new Date(),
            scheduledAt: null,
          },
        });

        await this.recalculateManuscriptTotalWords(manuscript.id, tx);

        return updatedChapter;
      }
    );

    await this.createChapterSummaryJobIfNeeded(chapterId, userId, 'PUBLISHED');

    return publishedChapter;
  }

  /**
   * 设置章节定时发布时间。
   */
  async scheduleChapterPublish(chapterId: number, userId: number, scheduledAt: Date) {
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('定时发布时间不正确');
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('定时发布时间必须晚于当前时间');
    }

    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    return this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      const updatedChapter = await tx.manuscript_chapter.update({
        where: { id: chapterId },
        data: {
          status: 'SCHEDULED',
          scheduledAt,
          publishedAt: null,
        },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);

      return updatedChapter;
    });
  }

  /**
   * 取消章节定时发布。
   */
  async cancelChapterSchedule(chapterId: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    return this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      const updatedChapter = await tx.manuscript_chapter.update({
        where: { id: chapterId },
        data: {
          status: 'DRAFT',
          scheduledAt: null,
        },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);

      return updatedChapter;
    });
  }

  /**
   * 发布当前用户已到定时时间的章节。
   */
  async publishDueScheduledChapters(userId: number, now = new Date()) {
    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now,
        },
        OR: [
          {
            manuscript: {
              userId,
            },
          },
          {
            volume: {
              manuscript: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        manuscript: true,
        volume: {
          include: {
            manuscript: true,
          },
        },
      },
    });

    const manuscriptIds = new Set<number>();
    chapters.forEach((chapter) => {
      const manuscript = chapter.manuscript || chapter.volume?.manuscript;
      if (manuscript) {
        manuscriptIds.add(manuscript.id);
      }
    });

    await this.runLockedTransaction(
      Array.from(manuscriptIds).map((manuscriptId) => this.getManuscriptLock(manuscriptId)),
      async (tx) => {
        for (const chapter of chapters) {
          await tx.manuscript_chapter.update({
            where: { id: chapter.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: chapter.publishedAt || now,
              scheduledAt: null,
            },
          });
        }

        for (const manuscriptId of manuscriptIds) {
          await this.recalculateManuscriptTotalWords(manuscriptId, tx);
        }
      }
    );

    return { count: chapters.length };
  }

  /**
   * 发布全部已到定时时间的章节，供后台定时任务使用。
   */
  async publishAllDueScheduledChapters(now = new Date()) {
    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        manuscript: true,
        volume: {
          include: {
            manuscript: true,
          },
        },
      },
    });

    const manuscriptIds = new Set<number>();
    chapters.forEach((chapter) => {
      const manuscript = chapter.manuscript || chapter.volume?.manuscript;
      if (manuscript) {
        manuscriptIds.add(manuscript.id);
      }
    });

    await this.runLockedTransaction(
      Array.from(manuscriptIds).map((manuscriptId) => this.getManuscriptLock(manuscriptId)),
      async (tx) => {
        for (const chapter of chapters) {
          await tx.manuscript_chapter.update({
            where: { id: chapter.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: chapter.publishedAt || now,
              scheduledAt: null,
            },
          });
        }

        for (const manuscriptId of manuscriptIds) {
          await this.recalculateManuscriptTotalWords(manuscriptId, tx);
        }
      }
    );

    return { count: chapters.length };
  }

  /**
   * 取消发布章节
   */
  async unpublishChapter(chapterId: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    return this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      const updatedChapter = await tx.manuscript_chapter.update({
        where: { id: chapterId },
        data: {
          status: 'DRAFT',
          scheduledAt: null,
        },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);

      return updatedChapter;
    });
  }

  /**
   * 批量发布章节
   */
  async batchPublishChapters(chapterIds: number[], userId: number) {
    if (!chapterIds || chapterIds.length === 0) {
      throw new BadRequestException('Chapter IDs cannot be empty');
    }

    // 验证所有章节的权限
    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        id: { in: chapterIds },
      },
      include: {
        manuscript: true,
        volume: {
          include: {
            manuscript: true,
          },
        },
      },
    });

    if (chapters.length !== chapterIds.length) {
      throw new NotFoundException('Some chapters not found');
    }

    // 验证权限并收集 manuscriptId
    const manuscriptIds = new Set<number>();
    for (const chapter of chapters) {
      const manuscript = chapter.manuscript || chapter.volume?.manuscript;
      if (!manuscript || manuscript.userId !== userId) {
        throw new ForbiddenException('无权发布这些章节');
      }
      manuscriptIds.add(manuscript.id);
    }

    await this.runLockedTransaction(
      Array.from(manuscriptIds).map((manuscriptId) => this.getManuscriptLock(manuscriptId)),
      async (tx) => {
        const currentChapters = await tx.manuscript_chapter.findMany({
          where: {
            id: { in: chapterIds },
          },
          select: {
            id: true,
            publishedAt: true,
          },
        });

        for (const chapterId of chapterIds) {
          const currentChapter = currentChapters.find((chapter) => chapter.id === chapterId);

          await tx.manuscript_chapter.update({
            where: { id: chapterId },
            data: {
              status: 'PUBLISHED',
              publishedAt: currentChapter?.publishedAt || new Date(),
              scheduledAt: null,
            },
          });
        }

        for (const manuscriptId of manuscriptIds) {
          await this.recalculateManuscriptTotalWords(manuscriptId, tx);
        }
      }
    );

    return { count: chapterIds.length };
  }

  /**
   * 计算字数（中文字符）
   */
  private calculateWordCount(content: string): number {
    return countWrittenWords(content);
  }

  /**
   * 重新计算文稿总字数、已发布字数以及各卷字数
   */
  private async recalculateManuscriptTotalWords(
    manuscriptId: number,
    prismaClient: ManuscriptDbClient = this.prisma
  ) {
    const manuscript = await prismaClient.manuscripts.findUnique({
      where: { id: manuscriptId },
      include: {
        chapters: true,
        volumes: {
          include: {
            chapters: true,
          },
        },
      },
    });

    if (!manuscript) {
      return;
    }

    let totalWords = 0;
    let publishedWords = 0;

    // 无卷章节
    manuscript.chapters.forEach((ch) => {
      totalWords += ch.wordCount;
      if (ch.status === 'PUBLISHED') {
        publishedWords += ch.wordCount;
      }
    });

    // 卷内章节，并更新每卷的字数统计
    for (const vol of manuscript.volumes) {
      let volumeWordCount = 0;

      vol.chapters.forEach((ch) => {
        totalWords += ch.wordCount;
        volumeWordCount += ch.wordCount;
        if (ch.status === 'PUBLISHED') {
          publishedWords += ch.wordCount;
        }
      });

      // 更新卷的字数统计
      await prismaClient.manuscript_volume.update({
        where: { id: vol.id },
        data: { wordCount: volumeWordCount },
      });
    }

    // 更新文稿总字数
    await prismaClient.manuscripts.update({
      where: { id: manuscriptId },
      data: { totalWords, publishedWords },
    });
  }

  /**
   * 获取文稿的设定（考虑projectId优先级）
   */
  async getManuscriptSettings(manuscriptId: number, userId: number) {
    const manuscript = await this.findOne(manuscriptId, userId);
    return this.aiContextService.loadManuscriptContext(manuscript, userId);
  }

  private async persistAiGenerationCandidate(params: {
    taskType: AiTaskType;
    manuscriptId: number;
    projectId?: number | null;
    outlineId?: number | null;
    chapterId: number;
    targetContentVersion?: number | null;
    outputText: string;
    customPrompt?: string;
    sourceText?: string;
    overrideConfig?: ManuscriptAiTaskOverrideConfig;
    systemPrompt: string;
    userPrompt: string;
    presetId?: number | null;
    presetVersion?: number | null;
    effectiveConfig: AiEffectiveConfig;
    contextSources: AiContextSourceItem[];
    latencyMs: number;
  }): Promise<AiGenerationResponse> {
    const requestPayload: Prisma.InputJsonObject = {
      customPrompt: params.customPrompt ?? null,
      sourceTextLength: params.sourceText?.length ?? null,
      overrideConfig: this.serializeAiOverrideConfig(params.overrideConfig),
    };

    const generationRecord = await this.prisma.ai_generation_records.create({
      data: {
        projectId: params.projectId ?? null,
        taskType: params.taskType,
        provider: params.effectiveConfig.provider,
        model: params.effectiveConfig.model,
        presetId: params.presetId ?? null,
        presetVersion: params.presetVersion ?? null,
        requestPayload,
        contextSnapshot: {
          sources: params.contextSources,
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
        },
        outputText: params.outputText,
        latencyMs: params.latencyMs,
        status: 'SUCCESS',
      },
    });

    const candidate = await this.prisma.ai_generation_candidates.create({
      data: {
        generationRecordId: generationRecord.id,
        projectId: params.projectId ?? null,
        outlineId: params.outlineId ?? null,
        manuscriptId: params.manuscriptId,
        chapterId: params.chapterId,
        candidateType: AiCandidateType.TEXT,
        targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
        targetId: params.chapterId,
        targetContentVersion: params.targetContentVersion ?? null,
        content: params.outputText,
        applyStatus: AiCandidateApplyStatus.PENDING,
      },
    });

    return {
      generationRecord: this.serializeGenerationRecord(generationRecord),
      candidate: this.serializeGenerationCandidate(candidate),
      effectiveConfig: params.effectiveConfig,
      contextSources: params.contextSources,
    };
  }

  private async runManuscriptAiGeneration(params: {
    taskType: AiTaskType;
    logLabel: string;
    chapterId: number;
    userId: number;
    sourceText?: string;
    customPrompt?: string;
    overrideConfig?: ManuscriptAiTaskOverrideConfig;
    createFallbackPrompt: (input: ManuscriptPromptInput) => ManuscriptPromptDefinition;
  }): Promise<AiGenerationResponse> {
    const chapter = await this.prisma.manuscript_chapter.findUnique({
      where: { id: params.chapterId },
      include: {
        manuscript: true,
        volume: { include: { manuscript: true } },
        content: true,
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${params.chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== params.userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    const settings = await this.aiContextService.loadManuscriptContext(manuscript, params.userId, {
      chapterId: params.chapterId,
      manuscriptId: chapter.manuscriptId,
      volumeId: chapter.volumeId,
      sortOrder: chapter.sortOrder,
    });
    const { settingsContext, contextSources } = settings;
    const effectiveAiConfig = this.applyOneOffAiOverride(
      settings.aiConfig,
      params.taskType,
      params.overrideConfig
    );
    const currentContent = chapter.content?.content || '';
    const promptInput = {
      settingsContext,
      currentContent,
      sourceText: params.sourceText,
      customPrompt: params.customPrompt,
    };
    const fallbackPrompt = params.createFallbackPrompt(promptInput);
    const resolvedPrompt = await this.resolvePromptPreset({
      taskType: params.taskType,
      aiConfig: effectiveAiConfig,
      userId: params.userId,
      projectId: manuscript.projectId,
      fallback: fallbackPrompt,
      input: promptInput,
    });

    try {
      this.logger.debug(
        `[${params.logLabel}] 章节ID: ${params.chapterId}, 用户ID: ${params.userId}`
      );

      const startedAt = Date.now();
      const model = this.aiService.getConfiguredStreamingModel(
        this.toAiModelRuntimeConfig(effectiveAiConfig)
      );
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', resolvedPrompt.systemPrompt],
        ['human', resolvedPrompt.userPrompt],
      ]);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      const result = await chain.invoke({});

      this.logger.debug(
        `[${params.logLabel}完成] 章节ID: ${params.chapterId}, 生成字数: ${result.length}`
      );

      return this.persistAiGenerationCandidate({
        taskType: params.taskType,
        manuscriptId: manuscript.id,
        projectId: manuscript.projectId,
        outlineId: manuscript.outlineId,
        chapterId: params.chapterId,
        targetContentVersion: chapter.content?.version ?? null,
        outputText: result,
        customPrompt: params.customPrompt,
        sourceText: params.sourceText,
        overrideConfig: params.overrideConfig,
        systemPrompt: resolvedPrompt.systemPrompt,
        userPrompt: resolvedPrompt.userPrompt,
        presetId: resolvedPrompt.presetId,
        presetVersion: resolvedPrompt.presetVersion,
        effectiveConfig: this.toEffectiveConfig(effectiveAiConfig, params.taskType),
        contextSources,
        latencyMs: Date.now() - startedAt,
      });
    } catch (error) {
      this.logger.error(`[${params.logLabel}失败] 章节ID: ${params.chapterId}`, error);
      throw new BadRequestException(`${params.logLabel}失败，请稍后重试`);
    }
  }

  /**
   * AI 续写章节内容
   */
  async continueChapter(
    chapterId: number,
    userId: number,
    customPrompt?: string,
    overrideConfig?: ManuscriptAiTaskOverrideConfig
  ): Promise<AiGenerationResponse> {
    return this.runManuscriptAiGeneration({
      taskType: AiTaskType.MANUSCRIPT_CONTINUE,
      logLabel: 'AI 续写',
      chapterId,
      userId,
      customPrompt,
      overrideConfig,
      createFallbackPrompt: ({ settingsContext, currentContent }) => {
        const systemPrompt = `你是一位专业的网络小说作家助手。你的任务是根据已有的章节内容和相关设定，续写后续内容。

## 续写要求：
1. 保持与已有内容的文风一致
2. 情节发展要合理自然
3. 充分利用已有的角色、世界观等设定
4. 避免突兀的转折和逻辑矛盾
5. 续写内容应在 500-1000 字左右

## 相关设定：
${settingsContext}`;

        const userPromptTemplate = `## 已有章节内容：
${currentContent.substring(Math.max(0, currentContent.length - 2000))}

{{#customPrompt}}## 额外要求：
{{customPrompt}}
{{/customPrompt}}
请根据以上内容续写后续情节。`;
        return { systemPrompt, userPromptTemplate };
      },
    });
  }

  /**
   * AI 润色文本
   */
  async polishText(
    chapterId: number,
    userId: number,
    text: string,
    customPrompt?: string,
    overrideConfig?: ManuscriptAiTaskOverrideConfig
  ): Promise<AiGenerationResponse> {
    return this.runManuscriptAiGeneration({
      taskType: AiTaskType.MANUSCRIPT_POLISH,
      logLabel: 'AI 润色',
      chapterId,
      userId,
      sourceText: text,
      customPrompt,
      overrideConfig,
      createFallbackPrompt: ({ settingsContext }) => {
        const systemPrompt = `你是一位专业的文字编辑。你的任务是对提供的文本进行润色，提升文字表达质量。

## 润色要求：
1. 优化语言表达，使其更加流畅优美
2. 修正语法错误和错别字
3. 增强场景描写的画面感
4. 保持原文的核心意思和情节不变
5. 保持原文的文风特点
6. 与已有角色、世界观和设定保持一致

## 相关设定：
${settingsContext}`;

        const userPromptTemplate = `## 待润色文本：
{{sourceText}}

{{#customPrompt}}## 额外要求：
{{customPrompt}}
{{/customPrompt}}
请对以上文本进行润色，直接输出润色后的结果，不要添加任何解释说明。`;
        return { systemPrompt, userPromptTemplate };
      },
    });
  }

  /**
   * AI 扩写文本
   */
  async expandText(
    chapterId: number,
    userId: number,
    text: string,
    customPrompt?: string,
    overrideConfig?: ManuscriptAiTaskOverrideConfig
  ): Promise<AiGenerationResponse> {
    return this.runManuscriptAiGeneration({
      taskType: AiTaskType.MANUSCRIPT_EXPAND,
      logLabel: 'AI 扩写',
      chapterId,
      userId,
      sourceText: text,
      customPrompt,
      overrideConfig,
      createFallbackPrompt: ({ settingsContext }) => {
        const systemPrompt = `你是一位专业的网络小说作家助手。你的任务是对简短的文本进行扩写，丰富细节描写。

## 扩写要求：
1. 扩充场景描写，增强画面感和代入感
2. 丰富人物的心理活动和情绪变化
3. 添加合理的对话和互动
4. 保持情节的核心不变
5. 扩写后的内容应为原文的 2-3 倍长度

## 相关设定：
${settingsContext}`;

        const userPromptTemplate = `## 待扩写文本：
{{sourceText}}

{{#customPrompt}}## 额外要求：
{{customPrompt}}
{{/customPrompt}}
请对以上文本进行扩写，直接输出扩写后的结果，不要添加任何解释说明。`;
        return { systemPrompt, userPromptTemplate };
      },
    });
  }

  async processChapterSummarizeJob(job: { userId?: number; chapterId?: number | null }) {
    if (!job.userId || !job.chapterId) {
      throw new BadRequestException('章节摘要任务缺少必要参数');
    }

    const chapter = await this.getChapterWithManuscript(this.prisma, job.chapterId, true);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${job.chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== job.userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    const currentContent = chapter.content?.content?.trim();
    if (!currentContent) {
      throw new BadRequestException('章节正文为空，无法生成摘要');
    }

    const settings = await this.aiContextService.loadManuscriptContext(manuscript, job.userId, {
      chapterId: job.chapterId,
      manuscriptId: chapter.manuscriptId,
      volumeId: chapter.volumeId,
      sortOrder: chapter.sortOrder,
    });
    const model = this.aiService.getConfiguredStreamingModel(
      this.toAiModelRuntimeConfig(settings.aiConfig)
    );
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `你是一位小说编辑助手。请根据章节正文生成简洁准确的章节摘要，用于后续 AI 写作上下文。

## 要求：
1. 只输出摘要正文，不要添加标题或解释
2. 保留关键事件、人物状态、冲突和伏笔
3. 控制在 120 字以内

## 项目上下文：
${settings.settingsContext}`,
      ],
      [
        'human',
        `## 章节标题：
${chapter.title}

## 章节正文：
${currentContent}`,
      ],
    ]);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const summary = (await chain.invoke({})).trim();

    if (!summary) {
      throw new BadRequestException('章节摘要生成结果为空');
    }

    await this.prisma.chapter_summaries.upsert({
      where: { chapterId: job.chapterId },
      create: {
        chapterId: job.chapterId,
        projectId: manuscript.projectId,
        summary,
        summaryType: 'AI',
        sourceVersion: chapter.content?.version ?? null,
        generatedBy: job.userId,
      },
      update: {
        projectId: manuscript.projectId,
        summary,
        summaryType: 'AI',
        sourceVersion: chapter.content?.version ?? null,
        generatedBy: job.userId,
      },
    });

    return {
      chapterId: job.chapterId,
      summaryLength: summary.length,
    };
  }

  /**
   * 采纳 AI 候选结果
   */
  async applyAiCandidate(
    candidateId: number,
    userId: number,
    dto: ApplyAiCandidateDto
  ): Promise<AiGenerationCandidate> {
    if (
      dto.mode !== AiCandidateApplyMode.INSERT_TAIL &&
      dto.mode !== AiCandidateApplyMode.OVERWRITE_DRAFT &&
      dto.mode !== AiCandidateApplyMode.SAVE_AS_DRAFT &&
      dto.mode !== AiCandidateApplyMode.REPLACE_SELECTION
    ) {
      throw new BadRequestException('当前仅支持追加、替换选区、覆盖当前草稿或暂存为草稿');
    }

    const candidateSnapshot = await this.prisma.ai_generation_candidates.findUnique({
      where: { id: candidateId },
      select: {
        manuscriptId: true,
      },
    });

    if (!candidateSnapshot?.manuscriptId) {
      throw new NotFoundException(`AI candidate with id ${candidateId} not found`);
    }

    return this.runLockedTransaction(
      [this.getManuscriptLock(candidateSnapshot.manuscriptId)],
      async (tx) => {
        const candidate = await tx.ai_generation_candidates.findUnique({
          where: { id: candidateId },
        });

        if (!candidate?.chapterId) {
          throw new NotFoundException(`AI candidate with id ${candidateId} not found`);
        }

        if (candidate.applyStatus !== AiCandidateApplyStatus.PENDING) {
          throw new BadRequestException('该候选结果已处理');
        }

        if (candidate.targetType !== 'MANUSCRIPT_CHAPTER_CONTENT') {
          throw new BadRequestException('当前仅支持采纳章节正文候选');
        }

        const chapter = await this.getChapterWithManuscript(tx, candidate.chapterId, true);

        if (!chapter) {
          throw new NotFoundException(`Chapter with id ${candidate.chapterId} not found`);
        }

        const manuscript = chapter.manuscript || chapter.volume?.manuscript;
        if (
          !manuscript ||
          manuscript.userId !== userId ||
          manuscript.id !== candidate.manuscriptId
        ) {
          throw new ForbiddenException('无权采纳该候选结果');
        }

        const currentVersion = chapter.content?.version ?? null;
        if (
          candidate.targetContentVersion !== null &&
          candidate.targetContentVersion !== currentVersion
        ) {
          throw new BadRequestException('章节内容已变化，请重新生成候选');
        }

        const existingContent = chapter.content?.content ?? '';
        const nextContent = this.buildAppliedCandidateContent({
          mode: dto.mode,
          existingContent,
          candidateContent: candidate.content,
          selectedText: dto.selectedText,
        });
        const nextVersion = chapter.content ? chapter.content.version + 1 : 1;

        if (chapter.content) {
          await tx.manuscript_chapter_content_version.create({
            data: {
              contentId: chapter.content.id,
              version: chapter.content.version,
              content: chapter.content.content,
            },
          });

          await tx.manuscript_chapter_content.update({
            where: { chapterId: candidate.chapterId },
            data: {
              content: nextContent,
              version: nextVersion,
            },
          });
        } else {
          await tx.manuscript_chapter_content.create({
            data: {
              chapterId: candidate.chapterId,
              content: nextContent,
              version: nextVersion,
            },
          });
        }

        await tx.manuscript_chapter.update({
          where: { id: candidate.chapterId },
          data: { wordCount: this.calculateWordCount(nextContent) },
        });

        await tx.manuscripts.update({
          where: { id: manuscript.id },
          data: {
            lastEditedChapterId: candidate.chapterId,
            lastEditedAt: new Date(),
          },
        });

        await this.recalculateManuscriptTotalWords(manuscript.id, tx);

        const appliedCandidate = await tx.ai_generation_candidates.update({
          where: { id: candidateId },
          data: {
            applyStatus: AiCandidateApplyStatus.APPLIED,
            appliedBy: userId,
            appliedAt: new Date(),
            applyMode: dto.mode,
            appliedContentVersion: nextVersion,
          },
        });

        return this.serializeGenerationCandidate(appliedCandidate);
      }
    );
  }

  /**
   * 丢弃 AI 候选结果
   */
  async discardAiCandidate(candidateId: number, userId: number): Promise<AiGenerationCandidate> {
    const candidate = await this.prisma.ai_generation_candidates.findUnique({
      where: { id: candidateId },
    });

    if (!candidate?.manuscriptId) {
      throw new NotFoundException(`AI candidate with id ${candidateId} not found`);
    }

    const manuscript = await this.prisma.manuscripts.findFirst({
      where: {
        id: candidate.manuscriptId,
        userId,
      },
      select: { id: true },
    });

    if (!manuscript) {
      throw new ForbiddenException('无权丢弃该候选结果');
    }

    if (candidate.applyStatus !== AiCandidateApplyStatus.PENDING) {
      throw new BadRequestException('该候选结果已处理');
    }

    const discardedCandidate = await this.prisma.ai_generation_candidates.update({
      where: { id: candidateId },
      data: {
        applyStatus: AiCandidateApplyStatus.DISCARDED,
        appliedBy: userId,
        appliedAt: new Date(),
      },
    });

    return this.serializeGenerationCandidate(discardedCandidate);
  }

  /**
   * 获取章节内容的版本历史
   */
  async getChapterVersionHistory(chapterId: number, userId: number) {
    const chapter = await this.prisma.manuscript_chapter.findUnique({
      where: { id: chapterId },
      include: {
        manuscript: true,
        volume: { include: { manuscript: true } },
        content: true,
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    if (!chapter.content) {
      return [];
    }

    // 获取所有历史版本
    const versions = await this.prisma.manuscript_chapter_content_version.findMany({
      where: {
        contentId: chapter.content.id,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return versions;
  }

  /**
   * 恢复到指定版本
   */
  async restoreChapterVersion(chapterId: number, version: number, userId: number) {
    const chapter = await this.getChapterWithManuscript(this.prisma, chapterId, true);

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    const manuscript = chapter.manuscript || chapter.volume?.manuscript;
    if (!manuscript || manuscript.userId !== userId) {
      throw new ForbiddenException('无权访问该章节');
    }

    if (!chapter.content) {
      throw new NotFoundException('Chapter content not found');
    }

    await this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      const currentChapter = await this.getChapterWithManuscript(tx, chapterId, true);

      if (!currentChapter) {
        throw new NotFoundException(`Chapter with id ${chapterId} not found`);
      }

      const currentManuscript = currentChapter.manuscript || currentChapter.volume?.manuscript;
      if (!currentManuscript || currentManuscript.userId !== userId) {
        throw new ForbiddenException('无权访问该章节');
      }

      if (!currentChapter.content) {
        throw new NotFoundException('Chapter content not found');
      }

      const targetVersion = await tx.manuscript_chapter_content_version.findFirst({
        where: {
          contentId: currentChapter.content.id,
          version,
        },
      });

      if (!targetVersion) {
        throw new NotFoundException(`Version ${version} not found`);
      }

      await tx.manuscript_chapter_content_version.create({
        data: {
          contentId: currentChapter.content.id,
          version: currentChapter.content.version,
          content: currentChapter.content.content,
        },
      });

      await tx.manuscript_chapter_content.update({
        where: { chapterId },
        data: {
          content: targetVersion.content,
          version: currentChapter.content.version + 1,
        },
      });

      await tx.manuscript_chapter.update({
        where: { id: chapterId },
        data: {
          wordCount: this.calculateWordCount(targetVersion.content),
        },
      });

      await tx.manuscripts.update({
        where: { id: manuscript.id },
        data: {
          lastEditedChapterId: chapterId,
          lastEditedAt: new Date(),
        },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);
    });

    return this.getChapterContent(chapterId, userId);
  }

  /**
   * 获取用户的写作统计数据
   */
  async getUserStats(userId: number) {
    // 获取用户所有未删除的文稿
    const manuscripts = await this.prisma.manuscripts.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: this.getManuscriptInclude(),
    });

    // 统计总字数、已发布字数
    let totalWords = 0;
    let publishedWords = 0;
    let totalChapters = 0;
    let publishedChapters = 0;
    const totalManuscripts = manuscripts.length;
    let draftManuscripts = 0;
    let completedManuscripts = 0;
    let inProgressManuscripts = 0;
    let publishedManuscripts = 0;
    let abandonedManuscripts = 0;

    for (const manuscript of manuscripts) {
      totalWords += manuscript.totalWords || 0;
      publishedWords += manuscript.publishedWords || 0;

      // 统计章节数
      const manuscriptChapters =
        (manuscript.chapters?.length || 0) +
        (manuscript.volumes?.reduce((sum, vol) => sum + (vol.chapters?.length || 0), 0) || 0);
      totalChapters += manuscriptChapters;

      // 统计已发布章节数
      const manuscriptPublishedChapters =
        (manuscript.chapters?.filter((ch) => ch.status === 'PUBLISHED').length || 0) +
        (manuscript.volumes?.reduce(
          (sum, vol) => sum + (vol.chapters?.filter((ch) => ch.status === 'PUBLISHED').length || 0),
          0
        ) || 0);
      publishedChapters += manuscriptPublishedChapters;

      // 统计文稿状态
      switch (manuscript.status) {
        case 'DRAFT':
          draftManuscripts++;
          break;
        case 'IN_PROGRESS':
          inProgressManuscripts++;
          break;
        case 'COMPLETED':
          completedManuscripts++;
          break;
        case 'PUBLISHED':
          publishedManuscripts++;
          break;
        case 'ABANDONED':
          abandonedManuscripts++;
          break;
      }
    }

    const recentDateList = buildRecentDateKeys(7);
    const monthlyDateList = buildRecentDateKeys(30);
    const recentDateKeys = new Set(recentDateList);
    const monthlyDateKeys = new Set(monthlyDateList);
    const writingEvents = await this.getWritingEvents(userId);

    // 按天统计字数
    const dailyStats = Object.fromEntries(recentDateList.map((date) => [date, 0]));
    const monthlyStats = Object.fromEntries(monthlyDateList.map((date) => [date, 0]));
    for (const event of writingEvents) {
      const dateKey = getDateKeyInTimeZone(event.occurredAt);

      if (recentDateKeys.has(dateKey)) {
        dailyStats[dateKey] = (dailyStats[dateKey] || 0) + event.words;
      }

      if (monthlyDateKeys.has(dateKey)) {
        monthlyStats[dateKey] = (monthlyStats[dateKey] || 0) + event.words;
      }
    }

    const projectContribution = manuscripts
      .map((manuscript) => ({
        id: manuscript.id,
        name: manuscript.name,
        totalWords: manuscript.totalWords || 0,
        publishedWords: manuscript.publishedWords || 0,
        chapterCount:
          (manuscript.chapters?.length || 0) +
          (manuscript.volumes?.reduce((sum, vol) => sum + (vol.chapters?.length || 0), 0) || 0),
      }))
      .sort((left, right) => right.totalWords - left.totalWords)
      .slice(0, 8);

    const activeDays = Object.values(monthlyStats).filter((words) => words > 0).length;
    const monthWords = Object.values(monthlyStats).reduce((sum, words) => sum + words, 0);
    const averageDailyWords = activeDays > 0 ? Math.round(monthWords / activeDays) : 0;
    const bestWritingDay = Object.entries(monthlyStats)
      .sort((left, right) => right[1] - left[1])
      .map(([date, words]) => ({ date, words }))[0] ?? { date: '', words: 0 };

    return {
      totalWords,
      publishedWords,
      totalChapters,
      publishedChapters,
      totalManuscripts,
      draftManuscripts,
      completedManuscripts,
      inProgressManuscripts,
      publishedManuscripts,
      abandonedManuscripts,
      dailyStats,
      monthlyStats,
      projectContribution,
      activeDays,
      monthWords,
      averageDailyWords,
      bestWritingDay,
    };
  }

  /**
   * 批量更新卷排序
   * @param volumeIds 卷 ID 数组,按新的排序顺序排列
   * @param userId 用户 ID
   */
  async reorderVolumes(volumeIds: number[], userId: number) {
    if (!volumeIds || volumeIds.length === 0) {
      throw new BadRequestException('Volume IDs cannot be empty');
    }

    if (new Set(volumeIds).size !== volumeIds.length) {
      throw new BadRequestException('Volume IDs cannot contain duplicates');
    }

    // 验证所有卷的权限
    const volumes = await this.prisma.manuscript_volume.findMany({
      where: {
        id: { in: volumeIds },
      },
      include: {
        manuscript: true,
      },
    });

    if (volumes.length !== volumeIds.length) {
      throw new NotFoundException('Some volumes not found');
    }

    // 验证权限
    for (const volume of volumes) {
      if (volume.manuscript.userId !== userId) {
        throw new ForbiddenException('无权排序这些卷');
      }
    }

    const manuscriptIds = Array.from(new Set(volumes.map((volume) => volume.manuscriptId)));
    if (manuscriptIds.length !== 1) {
      throw new BadRequestException('只能对同一文稿下的卷进行排序');
    }

    const manuscriptId = manuscriptIds[0];
    const totalVolumeCount = await this.prisma.manuscript_volume.count({
      where: { manuscriptId },
    });
    if (totalVolumeCount !== volumeIds.length) {
      throw new BadRequestException('卷排序必须提交当前文稿的全部卷 ID');
    }

    await this.runLockedTransaction([this.getManuscriptLock(manuscriptId)], async (tx) => {
      const currentVolumes = await tx.manuscript_volume.findMany({
        where: {
          id: { in: volumeIds },
        },
        select: {
          id: true,
          manuscriptId: true,
        },
      });

      if (currentVolumes.length !== volumeIds.length) {
        throw new NotFoundException('Some volumes not found');
      }

      if (currentVolumes.some((volume) => volume.manuscriptId !== manuscriptId)) {
        throw new BadRequestException('只能对同一文稿下的卷进行排序');
      }

      const currentTotalVolumeCount = await tx.manuscript_volume.count({
        where: { manuscriptId },
      });
      if (currentTotalVolumeCount !== volumeIds.length) {
        throw new BadRequestException('卷排序必须提交当前文稿的全部卷 ID');
      }

      for (const [index, volumeId] of volumeIds.entries()) {
        await tx.manuscript_volume.update({
          where: { id: volumeId },
          data: { sortOrder: new Decimal(index + 1) },
        });
      }
    });

    return {};
  }

  /**
   * 批量更新章节排序
   * @param chapterIds 章节 ID 数组,按新的排序顺序排列
   * @param userId 用户 ID
   */
  async reorderChapters(chapterIds: number[], userId: number) {
    if (!chapterIds || chapterIds.length === 0) {
      throw new BadRequestException('Chapter IDs cannot be empty');
    }

    if (new Set(chapterIds).size !== chapterIds.length) {
      throw new BadRequestException('Chapter IDs cannot contain duplicates');
    }

    // 验证所有章节的权限
    const chapters = await this.prisma.manuscript_chapter.findMany({
      where: {
        id: { in: chapterIds },
      },
      include: {
        manuscript: true,
        volume: {
          include: {
            manuscript: true,
          },
        },
      },
    });

    if (chapters.length !== chapterIds.length) {
      throw new NotFoundException('Some chapters not found');
    }

    // 验证权限
    for (const chapter of chapters) {
      const manuscript = chapter.manuscript || chapter.volume?.manuscript;
      if (!manuscript || manuscript.userId !== userId) {
        throw new ForbiddenException('无权排序这些章节');
      }
    }

    const firstChapter = chapters[0];
    const targetVolumeId = firstChapter.volumeId;
    const targetManuscriptId =
      firstChapter.manuscriptId ?? firstChapter.volume?.manuscript.id ?? null;

    if (!targetManuscriptId) {
      throw new BadRequestException('章节所属文稿不存在');
    }

    const isSameParent = chapters.every((chapter) => {
      if (targetVolumeId !== null) {
        return chapter.volumeId === targetVolumeId;
      }

      return chapter.volumeId === null && chapter.manuscriptId === targetManuscriptId;
    });

    if (!isSameParent) {
      throw new BadRequestException('只能对同一父级下的章节进行排序');
    }

    const totalSiblingCount =
      targetVolumeId !== null
        ? await this.prisma.manuscript_chapter.count({
            where: { volumeId: targetVolumeId },
          })
        : await this.prisma.manuscript_chapter.count({
            where: {
              manuscriptId: targetManuscriptId,
              volumeId: null,
            },
          });

    if (totalSiblingCount !== chapterIds.length) {
      throw new BadRequestException('章节排序必须提交当前父级下的全部章节 ID');
    }

    const lock =
      targetVolumeId !== null
        ? this.getVolumeLock(targetVolumeId)
        : this.getManuscriptLock(targetManuscriptId);

    await this.runLockedTransaction([lock], async (tx) => {
      const currentChapters = await tx.manuscript_chapter.findMany({
        where: {
          id: { in: chapterIds },
        },
        select: {
          id: true,
          manuscriptId: true,
          volumeId: true,
        },
      });

      if (currentChapters.length !== chapterIds.length) {
        throw new NotFoundException('Some chapters not found');
      }

      const currentSameParent = currentChapters.every((chapter) => {
        if (targetVolumeId !== null) {
          return chapter.volumeId === targetVolumeId;
        }

        return chapter.volumeId === null && chapter.manuscriptId === targetManuscriptId;
      });

      if (!currentSameParent) {
        throw new BadRequestException('只能对同一父级下的章节进行排序');
      }

      const currentSiblingCount =
        targetVolumeId !== null
          ? await tx.manuscript_chapter.count({
              where: { volumeId: targetVolumeId },
            })
          : await tx.manuscript_chapter.count({
              where: {
                manuscriptId: targetManuscriptId,
                volumeId: null,
              },
            });

      if (currentSiblingCount !== chapterIds.length) {
        throw new BadRequestException('章节排序必须提交当前父级下的全部章节 ID');
      }

      for (const [index, chapterId] of chapterIds.entries()) {
        await tx.manuscript_chapter.update({
          where: { id: chapterId },
          data: { sortOrder: new Decimal(index + 1) },
        });
      }
    });

    return {};
  }
}
