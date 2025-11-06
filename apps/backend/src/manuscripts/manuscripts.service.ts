import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
   * 创建文稿
   */
  async createManuscript(userId: number, dto: CreateManuscriptDto) {
    return this.prisma.manuscripts.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        volumes: {
          include: {
            chapters: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        chapters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * 从大纲创建文稿
   */
  async createManuscriptFromOutline(userId: number, outlineId: number) {
    // 获取大纲信息
    const outline = await this.prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        volumes: {
          include: { chapters: true },
          orderBy: { sortOrder: 'asc' },
        },
        chapters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!outline) {
      throw new NotFoundException(`Outline with id ${outlineId} not found`);
    }

    if (outline.userId !== userId) {
      throw new BadRequestException('You do not have permission to access this outline');
    }

    // 创建文稿
    const manuscript = await this.prisma.manuscripts.create({
      data: {
        name: outline.name,
        description: `根据大纲《${outline.name}》创建`,
        type: outline.type,
        tags: outline.tags,
        outlineId: outline.id,
        userId,
        characters: outline.characters,
        systems: outline.systems,
        worlds: outline.worlds,
        misc: outline.misc,
      },
    });

    // 复制卷结构
    for (const outlineVolume of outline.volumes) {
      const volume = await this.prisma.manuscript_volume.create({
        data: {
          manuscriptId: manuscript.id,
          title: outlineVolume.title,
          description: outlineVolume.description,
          sortOrder: outlineVolume.sortOrder,
        },
      });

      // 复制卷内章节
      for (const outlineChapter of outlineVolume.chapters) {
        await this.prisma.manuscript_chapter.create({
          data: {
            volumeId: volume.id,
            title: outlineChapter.title,
            sortOrder: outlineChapter.sortOrder,
          },
        });
      }
    }

    // 复制无卷章节
    for (const outlineChapter of outline.chapters) {
      await this.prisma.manuscript_chapter.create({
        data: {
          manuscriptId: manuscript.id,
          title: outlineChapter.title,
          sortOrder: outlineChapter.sortOrder,
        },
      });
    }

    return this.findOne(manuscript.id, userId);
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
      include: {
        volumes: {
          include: {
            chapters: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        chapters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
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
      include: {
        volumes: {
          include: {
            chapters: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        chapters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
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

    return this.prisma.manuscripts.update({
      where: { id },
      data: dto,
      include: {
        volumes: {
          include: {
            chapters: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        chapters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
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

    // 获取当前最大sortOrder
    const lastVolume = await this.prisma.manuscript_volume.findFirst({
      where: { manuscriptId: dto.manuscriptId },
      orderBy: { sortOrder: 'desc' },
    });

    const sortOrder = lastVolume
      ? new Decimal(lastVolume.sortOrder.toString()).plus(1)
      : new Decimal(1);

    return this.prisma.manuscript_volume.create({
      data: {
        ...dto,
        sortOrder,
      },
      include: {
        chapters: true,
      },
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
      throw new BadRequestException('You do not have permission to access this volume');
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
      throw new BadRequestException('You do not have permission to access this volume');
    }

    // 删除卷时会级联删除卷内章节
    return this.prisma.manuscript_volume.delete({
      where: { id: volumeId },
    });
  }

  /**
   * 创建章节
   */
  async createChapter(dto: CreateChapterDto, userId: number) {
    // 验证权限
    if (dto.manuscriptId) {
      await this.findOne(dto.manuscriptId, userId);
    } else if (dto.volumeId) {
      const volume = await this.prisma.manuscript_volume.findUnique({
        where: { id: dto.volumeId },
        include: { manuscript: true },
      });

      if (!volume) {
        throw new NotFoundException(`Volume with id ${dto.volumeId} not found`);
      }

      if (volume.manuscript.userId !== userId) {
        throw new BadRequestException('You do not have permission to access this volume');
      }
    } else {
      throw new BadRequestException('Either manuscriptId or volumeId must be provided');
    }

    // 获取当前最大sortOrder
    const lastChapter = await this.prisma.manuscript_chapter.findFirst({
      where: dto.manuscriptId ? { manuscriptId: dto.manuscriptId } : { volumeId: dto.volumeId },
      orderBy: { sortOrder: 'desc' },
    });

    const sortOrder = lastChapter
      ? new Decimal(lastChapter.sortOrder.toString()).plus(1)
      : new Decimal(1);

    return this.prisma.manuscript_chapter.create({
      data: {
        ...dto,
        sortOrder,
      },
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
      throw new BadRequestException('You do not have permission to access this chapter');
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
      throw new BadRequestException('You do not have permission to access this chapter');
    }

    // 删除章节时会级联删除章节内容
    await this.prisma.manuscript_chapter.delete({
      where: { id: chapterId },
    });

    // 重新计算文稿字数
    await this.recalculateManuscriptTotalWords(manuscript.id);
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
      throw new BadRequestException('You do not have permission to access this chapter');
    }

    return chapter.content;
  }

  /**
   * 保存章节内容
   */
  async saveChapterContent(chapterId: number, dto: SaveChapterContentDto, userId: number) {
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
      throw new BadRequestException('You do not have permission to access this chapter');
    }

    const wordCount = this.calculateWordCount(dto.content);

    // 保存内容版本历史
    if (chapter.content) {
      await this.prisma.manuscript_chapter_content_version.create({
        data: {
          contentId: chapter.content.id,
          version: chapter.content.version,
          content: chapter.content.content,
        },
      });

      // 更新内容并递增版本号
      await this.prisma.manuscript_chapter_content.update({
        where: { chapterId },
        data: {
          content: dto.content,
          version: chapter.content.version + 1,
        },
      });
    } else {
      // 首次创建内容
      await this.prisma.manuscript_chapter_content.create({
        data: {
          chapterId,
          content: dto.content,
          version: 1,
        },
      });
    }

    // 更新章节字数
    await this.prisma.manuscript_chapter.update({
      where: { id: chapterId },
      data: { wordCount },
    });

    // 更新文稿的lastEditedChapterId和lastEditedAt
    await this.prisma.manuscripts.update({
      where: { id: manuscript.id },
      data: {
        lastEditedChapterId: chapterId,
        lastEditedAt: new Date(),
      },
    });

    // 重新计算文稿总字数
    await this.recalculateManuscriptTotalWords(manuscript.id);

    return this.getChapterContent(chapterId, userId);
  }

  /**
   * 发布章节
   */
  async publishChapter(chapterId: number, userId: number) {
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
      throw new BadRequestException('You do not have permission to access this chapter');
    }

    const updatedChapter = await this.prisma.manuscript_chapter.update({
      where: { id: chapterId },
      data: {
        status: 'PUBLISHED',
        publishedAt: chapter.publishedAt || new Date(), // 只记录首次发布时间
      },
    });

    // 重新计算已发布字数
    await this.recalculateManuscriptTotalWords(manuscript.id);

    return updatedChapter;
  }

  /**
   * 计算字数（中文字符）
   */
  private calculateWordCount(content: string): number {
    // 移除所有空白字符
    const cleanContent = content.replace(/\s/g, '');
    return cleanContent.length;
  }

  /**
   * 重新计算文稿总字数和已发布字数
   */
  private async recalculateManuscriptTotalWords(manuscriptId: number) {
    const manuscript = await this.prisma.manuscripts.findUnique({
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

    // 卷内章节
    manuscript.volumes.forEach((vol) => {
      vol.chapters.forEach((ch) => {
        totalWords += ch.wordCount;
        if (ch.status === 'PUBLISHED') {
          publishedWords += ch.wordCount;
        }
      });
    });

    await this.prisma.manuscripts.update({
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
      const project = await this.prisma.projects.findUnique({
        where: { id: manuscript.projectId },
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${manuscript.projectId} not found`);
      }

      // 并行获取所有关联的设定详情
      const [characters, systems, worlds, misc] = await Promise.all([
        this.getCharactersByIds(project.characters || []),
        this.getSystemsByIds(project.systems || []),
        this.getWorldsByIds(project.worlds || []),
        this.getMiscByIds(project.misc || []),
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
        this.getCharactersByIds(manuscript.characters || []),
        this.getSystemsByIds(manuscript.systems || []),
        this.getWorldsByIds(manuscript.worlds || []),
        this.getMiscByIds(manuscript.misc || []),
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
      throw new BadRequestException('You do not have permission to access this chapter');
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

      const model = this.aiService.getStreamingModel('moonshot');
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
      throw new BadRequestException('You do not have permission to access this chapter');
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

      const model = this.aiService.getStreamingModel('moonshot');
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
      throw new BadRequestException('You do not have permission to access this chapter');
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

      const model = this.aiService.getStreamingModel('moonshot');
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
  private async getCharactersByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.character_settings.findMany({
      where: {
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取系统设定
   */
  private async getSystemsByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.system_settings.findMany({
      where: {
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取世界设定
   */
  private async getWorldsByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.world_settings.findMany({
      where: {
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取辅助设定
   */
  private async getMiscByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.misc_settings.findMany({
      where: {
        id: { in: ids.map(Number) },
      },
    });
  }
}
