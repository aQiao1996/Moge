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
} from './manuscripts.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { AIService } from '../ai/ai.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Prisma } from '../../generated/prisma';
import {
  buildRecentDateKeySet,
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

/**
 * 文稿服务
 */
@Injectable()
export class ManuscriptsService {
  private readonly logger = new Logger(ManuscriptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService
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
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${lock.namespace}, ${lock.scopeId})`;
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

    return this.getChapterContent(chapterId, userId);
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

    return this.runLockedTransaction([this.getManuscriptLock(manuscript.id)], async (tx) => {
      const currentChapter = await this.getChapterWithManuscript(tx, chapterId);

      if (!currentChapter) {
        throw new NotFoundException(`Chapter with id ${chapterId} not found`);
      }

      const updatedChapter = await tx.manuscript_chapter.update({
        where: { id: chapterId },
        data: {
          status: 'PUBLISHED',
          publishedAt: currentChapter.publishedAt || new Date(),
        },
      });

      await this.recalculateManuscriptTotalWords(manuscript.id, tx);

      return updatedChapter;
    });
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

    if (manuscript.projectId) {
      // 通过项目获取设定
      const project = await this.prisma.projects.findFirst({
        where: {
          id: manuscript.projectId,
          userId,
        },
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${manuscript.projectId} not found`);
      }

      // 并行获取所有关联的设定详情
      const [characters, systems, worlds, misc] = await Promise.all([
        this.getCharactersByIds(project.characters || [], userId),
        this.getSystemsByIds(project.systems || [], userId),
        this.getWorldsByIds(project.worlds || [], userId),
        this.getMiscByIds(project.misc || [], userId),
      ]);

      return {
        characters,
        systems,
        worlds,
        misc,
      };
    } else {
      // 直接使用文稿的设定数组
      const [characters, systems, worlds, misc] = await Promise.all([
        this.getCharactersByIds(manuscript.characters || [], userId),
        this.getSystemsByIds(manuscript.systems || [], userId),
        this.getWorldsByIds(manuscript.worlds || [], userId),
        this.getMiscByIds(manuscript.misc || [], userId),
      ]);

      return {
        characters,
        systems,
        worlds,
        misc,
      };
    }
  }

  /**
   * 构建设定上下文文本
   * 将关联的设定信息格式化为 AI 可理解的上下文
   */
  private buildSettingsContext(settings: {
    characters: Array<{ name: string; background?: string | null; [key: string]: unknown }>;
    systems: Array<{ name: string; description?: string | null; [key: string]: unknown }>;
    worlds: Array<{ name: string; description?: string | null; [key: string]: unknown }>;
    misc: Array<{ name: string; description?: string | null; [key: string]: unknown }>;
  }): string {
    const parts: string[] = [];

    if (settings.characters.length > 0) {
      parts.push('## 角色设定');
      settings.characters.forEach((char) => {
        parts.push(`- ${char.name}: ${char.background || '暂无背景描述'}`);
      });
    }

    if (settings.systems.length > 0) {
      parts.push('## 系统设定');
      settings.systems.forEach((sys) => {
        parts.push(`- ${sys.name}: ${sys.description || '暂无描述'}`);
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

    return parts.length > 0 ? parts.join('\n') : '暂无关联设定，请根据已有内容自由发挥。';
  }

  /**
   * AI 续写章节内容
   */
  async continueChapter(chapterId: number, userId: number, customPrompt?: string): Promise<string> {
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

    // 获取设定上下文
    const settings = await this.getManuscriptSettings(manuscript.id, userId);
    const settingsContext = this.buildSettingsContext(settings);

    // 获取当前章节内容
    const currentContent = chapter.content?.content || '';

    // 构建 AI 提示词
    const systemPrompt = `你是一位专业的网络小说作家助手。你的任务是根据已有的章节内容和相关设定，续写后续内容。

## 续写要求：
1. 保持与已有内容的文风一致
2. 情节发展要合理自然
3. 充分利用已有的角色、世界观等设定
4. 避免突兀的转折和逻辑矛盾
5. 续写内容应在 500-1000 字左右

## 相关设定：
${settingsContext}`;

    const userPrompt = `## 已有章节内容：
${currentContent.substring(Math.max(0, currentContent.length - 2000))}

${customPrompt ? `## 额外要求：\n${customPrompt}\n` : ''}
请根据以上内容续写后续情节。`;

    try {
      this.logger.debug(`[AI 续写] 章节ID: ${chapterId}, 用户ID: ${userId}`);

      const model = this.aiService.getDefaultStreamingModel();
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());

      const result = await chain.invoke({});

      this.logger.debug(`[AI 续写完成] 章节ID: ${chapterId}, 生成字数: ${result.length}`);

      return result;
    } catch (error) {
      this.logger.error(`[AI 续写失败] 章节ID: ${chapterId}`, error);
      throw new BadRequestException('AI 续写失败，请稍后重试');
    }
  }

  /**
   * AI 润色文本
   */
  async polishText(
    chapterId: number,
    userId: number,
    text: string,
    customPrompt?: string
  ): Promise<string> {
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

    // 构建 AI 提示词
    const systemPrompt = `你是一位专业的文字编辑。你的任务是对提供的文本进行润色，提升文字表达质量。

## 润色要求：
1. 优化语言表达，使其更加流畅优美
2. 修正语法错误和错别字
3. 增强场景描写的画面感
4. 保持原文的核心意思和情节不变
5. 保持原文的文风特点`;

    const userPrompt = `## 待润色文本：
${text}

${customPrompt ? `## 额外要求：\n${customPrompt}\n` : ''}
请对以上文本进行润色，直接输出润色后的结果，不要添加任何解释说明。`;

    try {
      this.logger.debug(
        `[AI 润色] 章节ID: ${chapterId}, 用户ID: ${userId}, 文本长度: ${text.length}`
      );

      const model = this.aiService.getDefaultStreamingModel();
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());

      const result = await chain.invoke({});

      this.logger.debug(`[AI 润色完成] 章节ID: ${chapterId}, 生成字数: ${result.length}`);

      return result;
    } catch (error) {
      this.logger.error(`[AI 润色失败] 章节ID: ${chapterId}`, error);
      throw new BadRequestException('AI 润色失败，请稍后重试');
    }
  }

  /**
   * AI 扩写文本
   */
  async expandText(
    chapterId: number,
    userId: number,
    text: string,
    customPrompt?: string
  ): Promise<string> {
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

    // 获取设定上下文
    const settings = await this.getManuscriptSettings(manuscript.id, userId);
    const settingsContext = this.buildSettingsContext(settings);

    // 构建 AI 提示词
    const systemPrompt = `你是一位专业的网络小说作家助手。你的任务是对简短的文本进行扩写，丰富细节描写。

## 扩写要求：
1. 扩充场景描写，增强画面感和代入感
2. 丰富人物的心理活动和情绪变化
3. 添加合理的对话和互动
4. 保持情节的核心不变
5. 扩写后的内容应为原文的 2-3 倍长度

## 相关设定：
${settingsContext}`;

    const userPrompt = `## 待扩写文本：
${text}

${customPrompt ? `## 额外要求：\n${customPrompt}\n` : ''}
请对以上文本进行扩写，直接输出扩写后的结果，不要添加任何解释说明。`;

    try {
      this.logger.debug(
        `[AI 扩写] 章节ID: ${chapterId}, 用户ID: ${userId}, 文本长度: ${text.length}`
      );

      const model = this.aiService.getDefaultStreamingModel();
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', userPrompt],
      ]);
      const chain = prompt.pipe(model).pipe(new StringOutputParser());

      const result = await chain.invoke({});

      this.logger.debug(`[AI 扩写完成] 章节ID: ${chapterId}, 生成字数: ${result.length}`);

      return result;
    } catch (error) {
      this.logger.error(`[AI 扩写失败] 章节ID: ${chapterId}`, error);
      throw new BadRequestException('AI 扩写失败，请稍后重试');
    }
  }

  /**
   * 根据 ID 列表获取角色设定
   */
  private async getCharactersByIds(ids: string[], userId: number) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.character_settings.findMany({
      where: {
        userId,
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取系统设定
   */
  private async getSystemsByIds(ids: string[], userId: number) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.system_settings.findMany({
      where: {
        userId,
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取世界设定
   */
  private async getWorldsByIds(ids: string[], userId: number) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.world_settings.findMany({
      where: {
        userId,
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取辅助设定
   */
  private async getMiscByIds(ids: string[], userId: number) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.misc_settings.findMany({
      where: {
        userId,
        id: { in: ids.map(Number) },
      },
    });
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

    const recentDateKeys = buildRecentDateKeySet(7);
    const writingEvents = await this.getWritingEvents(userId);

    // 按天统计字数
    const dailyStats: Record<string, number> = {};
    for (const event of writingEvents) {
      const dateKey = getDateKeyInTimeZone(event.occurredAt);

      if (!recentDateKeys.has(dateKey)) {
        continue;
      }

      dailyStats[dateKey] = (dailyStats[dateKey] || 0) + event.words;
    }

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
