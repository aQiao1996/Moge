import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOutlineValues, UpdateOutlineValues, Outline } from '@moge/types';
import { BaseService } from '../base/base.service';
import { AIService } from '../ai/ai.service';
import { Observable, Subject } from 'rxjs';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { MessageEvent } from '@nestjs/common';
import { SensitiveFilterService, FilterLevel } from '../sensitive-filter/sensitive-filter.service';
import { SYSTEM_PROMPT, USER_PROMPT } from './prompts/outline.prompt';
import { MarkdownParserService, ParsedOutlineStructure } from './markdown-parser.service';

interface FindAllOptions {
  pageNum?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  era?: string;
  status?: Outline['status'];
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class OutlineService extends BaseService {
  private readonly logger = new Logger(OutlineService.name);
  private readonly STREAM_TIMEOUT = 120000; // 120 s

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly sensitiveFilter: SensitiveFilterService,
    private readonly markdownParser: MarkdownParserService
  ) {
    super();
  }

  /**
   * 流式生成大纲内容
   * @param id 大纲 ID
   * @param userId 用户 ID
   * @returns 包含流式数据的 Observable
   */
  generateContentStream(id: string, userId: string): Observable<MessageEvent> {
    const subject = new Subject<{ type: 'content' | 'complete'; data?: string }>();

    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort('timeout');
    }, this.STREAM_TIMEOUT);

    this._generateStreamWithSubject(id, userId, subject, abortController.signal).catch((error) => {
      if (!subject.closed) {
        subject.error(error);
      }
    });

    return new Observable((observer) => {
      const sub = subject.subscribe({
        next: (data) => {
          if (data.type === 'complete') {
            observer.next({ type: 'complete', data: null });
          } else {
            observer.next({ type: 'content', data: data.data });
          }
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      });

      return () => {
        clearTimeout(timeout);
        abortController.abort('cleanup');
        sub.unsubscribe();
      };
    });
  }

  // 定义小批量分发的配置
  private readonly DRIP_CHUNK_SIZE = 1; // 每次发送的字符数
  private readonly DRIP_INTERVAL = 20; // ms, 基础间隔
  private readonly PUNCTUATION_DELAY = 100; // ms, 遇到标点时的额外延迟

  /**
   * 缓冲区分发器
   * @param subject RxJS Subject 用于将数据推送到客户端
   * @param bufferRef 引用对象，包含需要发送的字符串缓冲区
   * @param isStreamFinishedRef 引用对象，标记上游 AI 流是否已结束
   * @param signal 中止信号，用于提前终止
   */
  private async _dripFeedBufferToSubject(
    subject: Subject<{ type: 'content' | 'complete'; data?: string }>,
    bufferRef: { current: string },
    isStreamFinishedRef: { current: boolean },
    signal: AbortSignal
  ) {
    while (!signal.aborted) {
      if (bufferRef.current.length > 0) {
        // 从缓冲区取出小批量字符
        const dripChunk = bufferRef.current.substring(0, this.DRIP_CHUNK_SIZE);
        bufferRef.current = bufferRef.current.substring(this.DRIP_CHUNK_SIZE);

        // 推送给前端
        subject.next({ type: 'content', data: dripChunk });

        // 检查块的最后一个字符是否为标点，以实现智能延迟
        const lastChar = dripChunk.slice(-1);
        if (['。', '！', '？', '，', '；', '、', '\n'].includes(lastChar)) {
          await new Promise((resolve) => setTimeout(resolve, this.PUNCTUATION_DELAY));
        } else {
          await new Promise((resolve) => setTimeout(resolve, this.DRIP_INTERVAL));
        }
      } else if (isStreamFinishedRef.current) {
        // 如果上游流已结束，且缓冲区已清空，则退出循环
        break;
      } else {
        // 如果缓冲区为空，但上游流尚未结束，则稍作等待，避免空转
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  }

  private async _generateStreamWithSubject(
    id: string,
    userId: string,
    subject: Subject<{ type: 'content' | 'complete'; data?: string }>,
    signal: AbortSignal
  ) {
    this.logger.debug(`[流开始] 大纲ID: ${id}, 用户ID: ${userId}`);
    let fullContent = ''; // 收集完整内容

    // --- 用于缓冲和状态管理的引用对象 ---
    const bufferRef = { current: '' };
    const isStreamFinishedRef = { current: false };

    // --- 启动独立的缓冲区分发器 ---
    const dripPromise = this._dripFeedBufferToSubject(
      subject,
      bufferRef,
      isStreamFinishedRef,
      signal
    );

    try {
      const outline = await this.findOne(parseInt(id, 10), userId);
      if (!outline) {
        throw new NotFoundException('大纲不存在或无权限访问');
      }

      // ⭐ 获取关联的设定作为上下文
      const settings = await this.getOutlineSettings(parseInt(id, 10), userId);
      const settingsContext = this.buildSettingsContext(settings);

      const model = this.aiService.getStreamingModel('moonshot');
      const prompt = this.createPromptTemplate();
      const chain = prompt.pipe(model).pipe(new StringOutputParser());

      const stream = await chain.stream(
        {
          name: outline.name,
          type: outline.type,
          era: outline.era,
          tags: outline.tags.join(', '),
          remark: outline.remark,
          volumes: 3,
          chaptersPerVolume: 10,
          scenesPerChapter: 3,
          settingsContext, // ⭐ 注入设定上下文
        },
        { configurable: { signal } }
      );

      for await (const chunk of stream) {
        if (signal.aborted) break;

        fullContent += chunk; // 收集内容以供最终保存

        // ---  ---
        // subject.next({ type: 'content', data: chunk }); // 直接推送整个数据块
        bufferRef.current += chunk; // 将数据块送入缓冲区
        // ---  ---

        this.logger.debug(
          `[流数据块->缓冲] 大纲ID: ${id}, 长度: ${chunk.length}, 当前缓冲: ${bufferRef.current.length}`
        );
      }

      // 标记上游 AI 流已结束
      isStreamFinishedRef.current = true;
      // 等待分发器将缓冲区剩余内容全部发送完毕
      await dripPromise;

      if (signal.aborted) {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        this.logger.debug(`[流完成] 大纲ID: ${id}, 用户ID: ${userId}`);

        // 流完成后自动保存并解析结构化数据
        await this.autoSaveAndParseContent(parseInt(id, 10), userId, fullContent);

        subject.next({ type: 'complete' });
      }
    } catch (error) {
      isStreamFinishedRef.current = true; // 确保在出错时也能终止分发器循环
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        let errorMessage = '生成大纲时发生未知错误，请稍后重试。';
        let errorCode = 'UNKNOWN_ERROR';

        if (error instanceof Error) {
          this.logger.error(`[流错误] 大纲ID: ${id}, 用户ID: ${userId}`, error.stack);
          if (error.message.includes('429 Too Many Requests')) {
            errorMessage = '您的请求过于频繁，已超出当前使用额度。请检查您的套餐详情或稍后再试。';
            errorCode = 'RATE_LIMIT_EXCEEDED';
          }
        } else {
          this.logger.error(`[流错误] 大纲ID: ${id}, 用户ID: ${userId}`, error);
        }

        const errorPayload = { error: { message: errorMessage, code: errorCode } };
        subject.next({ type: 'content', data: JSON.stringify(errorPayload) });
      }
    } finally {
      this.logger.debug(`[流结束] 大纲ID: ${id}, 用户ID: ${userId}`);
      if (!subject.closed) {
        subject.complete();
      }
    }
  }

  /**
   * 构建设定上下文文本
   * 将关联的设定信息格式化为 AI 可理解的上下文
   *
   * @param settings 设定数据对象
   * @returns 格式化后的设定上下文字符串
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

    return parts.length > 0 ? parts.join('\n') : '暂无关联设定，请根据基础信息自由发挥。';
  }

  private createPromptTemplate() {
    return ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', USER_PROMPT],
    ]);
  }

  /**
   * 自动保存生成的内容并解析结构化数据
   */
  private async autoSaveAndParseContent(
    outlineId: number,
    userId: string,
    content: string
  ): Promise<void> {
    this.logger.debug(
      `[自动保存] 大纲ID: ${outlineId}, 用户ID: ${userId}, 内容长度: ${content.length}`
    );

    try {
      // 保存内容到 outline_content 表
      const existingContent = await this.prisma.outline_content.findUnique({
        where: { outlineId },
      });

      if (existingContent) {
        await this.prisma.outline_content.update({
          where: { outlineId },
          data: {
            content,
            version: existingContent.version + 1,
          },
        });
      } else {
        await this.prisma.outline_content.create({
          data: {
            outlineId,
            content,
            version: 1,
          },
        });
      }

      // 解析并存储结构化数据
      const parsedStructure = await this.markdownParser.parseOutlineMarkdown(content);
      if (this.markdownParser.validateParsedStructure(parsedStructure)) {
        await this.saveStructuredOutline(outlineId, parsedStructure);
        this.logger.debug(`[自动保存完成] 大纲ID: ${outlineId}, 已存储结构化数据`);
      } else {
        this.logger.warn(`[自动保存警告] 大纲ID: ${outlineId}, 结构化数据不合理`);
      }
    } catch (error) {
      this.logger.error(`[自动保存失败] 大纲ID: ${outlineId}`, error);
      // 不抛出错误，避免影响生成流程
    }
  }

  async create(userId: string, data: CreateOutlineValues) {
    const { name, type, era, conflict, tags, remark, characters, systems, worlds, misc } = data;

    // 用户输入敏感词检查 - 使用创作模式，允许文学创��用词
    const inputText = `${name} ${type} ${era} ${conflict || ''} ${tags?.join(' ') || ''} ${remark || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    const outline = await this.prisma.outline.create({
      data: {
        name,
        type,
        era,
        conflict,
        tags,
        remark,
        characters: characters || [],
        systems: systems || [],
        worlds: worlds || [],
        misc: misc || [],
        user: {
          connect: {
            id: parseInt(userId),
          },
        },
      },
    });

    // 转换为前端期望的字符串格式
    return {
      ...outline,
      id: outline.id.toString(),
      userId: outline.userId.toString(),
    };
  }

  async findAll(userId: string, options: FindAllOptions = {}) {
    const { search, type, era, tags, status, ...paginationOptions } = options;

    const { skip, take, orderBy } = this.buildPaginationAndSort<Outline>({
      ...paginationOptions,
      defaultSortBy: 'createdAt',
    });

    const where = this.buildWhereConditions(userId, {
      search,
      type,
      era,
      tags,
      status,
    });

    const [list, total] = await this.prisma.$transaction([
      this.prisma.outline.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.outline.count({
        where,
      }),
    ]);

    // 转换 ID 为字符串格式
    const transformedList = list.map((outline) => ({
      ...outline,
      id: outline.id.toString(),
      userId: outline.userId.toString(),
    }));

    return { list: transformedList, total };
  }

  private buildWhereConditions(
    userId: string,
    filters: {
      search?: string;
      type?: string;
      era?: string;
      tags?: string[];
      status?: Outline['status'];
    }
  ) {
    const { search, type, era, tags, status } = filters;

    const where: {
      userId: number;
      status?:
        | {
            not?: Outline['status'];
            in?: Outline['status'][];
          }
        | Outline['status'];
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        remark?: { contains: string; mode: 'insensitive' };
      }>;
      type?: string;
      era?: string;
      tags?: { hasSome: string[] };
    } = {
      userId: parseInt(userId),
      // 默认过滤掉已删除/废弃的大纲
      status: { not: 'DISCARDED' },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { remark: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;

    if (era) where.era = era;

    // 如果用户明确指定了状态，使用用户指定的状态；否则过滤掉已删除的
    if (status) {
      where.status = status;
    }
    // 如果没有指定状态，默认过滤掉已删除的大纲

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    return where;
  }

  async findOne(id: number, userId: string) {
    const outline = await this.prisma.outline.findUnique({
      where: { id },
    });

    if (outline?.userId !== parseInt(userId)) {
      throw new ForbiddenException('无权访问此大纲');
    }

    // 转换为前端期望的字符串格式
    if (outline) {
      return {
        ...outline,
        id: outline.id.toString(),
        userId: outline.userId.toString(),
      };
    }

    return outline;
  }

  async findDetail(id: number, userId: string) {
    // 先检查权限
    const outline = await this.prisma.outline.findUnique({
      where: { id },
    });

    if (!outline || outline.userId !== parseInt(userId)) {
      throw new ForbiddenException('无权访问此大纲');
    }

    // 获取完整的大纲结构，包括内容、卷和章节
    const fullOutline = await this.prisma.outline.findUnique({
      where: { id },
      include: {
        content: true,
        volumes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              orderBy: { sortOrder: 'asc' },
              include: {
                content: true,
              },
            },
          },
        },
        chapters: {
          where: { outlineId: id }, // 无卷的直接章节
          orderBy: { sortOrder: 'asc' },
          include: {
            content: true,
          },
        },
      },
    });

    if (!fullOutline) {
      throw new NotFoundException('大纲不存在');
    }

    // 转换为前端期望的格式
    return {
      ...fullOutline,
      id: fullOutline.id.toString(),
      userId: fullOutline.userId.toString(),
      content: fullOutline.content
        ? {
            ...fullOutline.content,
            id: fullOutline.content.id.toString(),
            outlineId: fullOutline.content.outlineId.toString(),
          }
        : null,
      volumes: fullOutline.volumes.map((volume) => ({
        ...volume,
        id: volume.id.toString(),
        outlineId: volume.outlineId.toString(),
        chapters: volume.chapters.map((chapter) => ({
          ...chapter,
          id: chapter.id.toString(),
          volumeId: chapter.volumeId?.toString(),
          content: chapter.content
            ? {
                ...chapter.content,
                id: chapter.content.id.toString(),
                chapterId: chapter.content.chapterId.toString(),
              }
            : null,
        })),
      })),
      chapters: fullOutline.chapters.map((chapter) => ({
        ...chapter,
        id: chapter.id.toString(),
        outlineId: chapter.outlineId?.toString(),
        content: chapter.content
          ? {
              ...chapter.content,
              id: chapter.content.id.toString(),
              chapterId: chapter.content.chapterId.toString(),
            }
          : null,
      })),
    };
  }

  async updateContent(id: number, userId: string, content: string) {
    // 先检查权限
    await this.findOne(id, userId);

    // 检查是否已有内容记录
    const existingContent = await this.prisma.outline_content.findUnique({
      where: { outlineId: id },
    });

    let result: {
      id: number;
      outlineId: number;
      content: string;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    };
    if (existingContent) {
      // 更新现有内容，版本号递增
      result = await this.prisma.outline_content.update({
        where: { outlineId: id },
        data: {
          content,
          version: existingContent.version + 1,
        },
      });
    } else {
      // 创建新的内容记录
      result = await this.prisma.outline_content.create({
        data: {
          outlineId: id,
          content,
          version: 1,
        },
      });
    }

    // 尝试解析并存储结构化数据
    try {
      const parsedStructure = await this.markdownParser.parseOutlineMarkdown(content);
      if (this.markdownParser.validateParsedStructure(parsedStructure)) {
        await this.saveStructuredOutline(id, parsedStructure);
        this.logger.debug(`[解析成功] 大纲ID: ${id}, 已存储结构化数据`);
      } else {
        this.logger.warn(`[解析失败] 大纲ID: ${id}, 结构化数据不合理`);
      }
    } catch (error) {
      this.logger.error(`[解析异常] 大纲ID: ${id}`, error);
      // 不影响主流程，继续返回结果
    }

    // 转换为前端期望的格式
    return {
      ...result,
      id: result.id.toString(),
      outlineId: result.outlineId.toString(),
    };
  }

  async update(id: number, userId: string, data: UpdateOutlineValues) {
    await this.findOne(id, userId);

    // 用户输入敏感词检查 - 使用创作模式，允许文学创作用词
    const { name, type, era, conflict, tags, remark } = data;
    const inputText = `${name || ''} ${type || ''} ${era || ''} ${conflict || ''} ${tags?.join(' ') || ''} ${remark || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    const updatedOutline = await this.prisma.outline.update({
      where: { id },
      data,
    });

    return {
      ...updatedOutline,
      id: updatedOutline.id.toString(),
      userId: updatedOutline.userId.toString(),
    };
  }

  /**
   * 更新卷信息
   */
  async updateVolume(
    outlineId: number,
    volumeId: number,
    userId: string,
    data: { title: string; description?: string }
  ) {
    // 验证大纲权限
    await this.findOne(outlineId, userId);

    // 验证卷是否属于该大纲
    const volume = await this.prisma.outline_volume.findFirst({
      where: {
        id: volumeId,
        outlineId: outlineId,
      },
    });

    if (!volume) {
      throw new NotFoundException('卷不存在或不属于该大纲');
    }

    // 敏感词检查 - 使用创作模式，允许文学创作用词
    const inputText = `${data.title} ${data.description || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    const updatedVolume = await this.prisma.outline_volume.update({
      where: { id: volumeId },
      data: {
        title: data.title,
        description: data.description,
      },
    });

    return {
      ...updatedVolume,
      id: updatedVolume.id.toString(),
      outlineId: updatedVolume.outlineId.toString(),
    };
  }

  /**
   * 更新章节信息
   */
  async updateChapter(
    outlineId: number,
    chapterId: number,
    userId: string,
    data: { title: string; content?: string }
  ) {
    // 验证大纲权限
    await this.findOne(outlineId, userId);

    // 验证章节是否属于该大纲（直接章节或卷内章节）
    const chapter = await this.prisma.outline_chapter.findFirst({
      where: {
        id: chapterId,
        OR: [
          { outlineId: outlineId }, // 直接章节
          {
            volume: {
              outlineId: outlineId,
            },
          }, // 卷内章节
        ],
      },
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在或不属于该大纲');
    }

    // 敏感词检查 - 使用创作模式，允许文学创作用词
    const inputText = `${data.title} ${data.content || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    // 更新章节标题
    const updatedChapter = await this.prisma.outline_chapter.update({
      where: { id: chapterId },
      data: {
        title: data.title,
      },
    });

    // 如果有内容，更新或创建章节内容
    type ChapterContentType = {
      id: number;
      chapterId: number;
      content: string;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    };

    let chapterContentResult: ChapterContentType | null = null;
    if (data.content !== undefined) {
      // 查找现有内容
      const existingContent = await this.prisma.outline_chapter_content.findFirst({
        where: { chapterId: chapterId },
        orderBy: { version: 'desc' },
      });

      if (existingContent) {
        // 更新现有内容
        chapterContentResult = (await this.prisma.outline_chapter_content.update({
          where: { id: existingContent.id },
          data: {
            content: data.content,
            version: existingContent.version + 1,
          },
        })) as ChapterContentType;
      } else {
        // 创建新内容
        chapterContentResult = (await this.prisma.outline_chapter_content.create({
          data: {
            chapterId: chapterId,
            content: data.content,
            version: 1,
          },
        })) as ChapterContentType;
      }
    }

    return {
      ...updatedChapter,
      id: updatedChapter.id.toString(),
      outlineId: updatedChapter.outlineId?.toString() || null,
      volumeId: updatedChapter.volumeId?.toString() || null,
      content: chapterContentResult
        ? {
            id: chapterContentResult.id.toString(),
            chapterId: chapterContentResult.chapterId.toString(),
            content: chapterContentResult.content,
            version: chapterContentResult.version,
            createdAt: chapterContentResult.createdAt,
            updatedAt: chapterContentResult.updatedAt,
          }
        : null,
    };
  }

  async delete(id: number, userId: string) {
    await this.findOne(id, userId);
    // 软删除：将状态改为 DISCARDED 而不是物理删除
    await this.prisma.outline.update({
      where: { id },
      data: { status: 'DISCARDED' },
    });
  }

  /**
   * 将解析后的结构化数据存储到数据库
   */
  private async saveStructuredOutline(
    outlineId: number,
    structure: ParsedOutlineStructure
  ): Promise<void> {
    this.logger.debug(
      `[结构化存储] 大纲ID: ${outlineId}, 卷数: ${structure.volumes.length}, 直接章节数: ${structure.directChapters.length}`
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. 清理现有的结构化数据（如果有的话）
        await tx.outline_volume.deleteMany({
          where: { outlineId },
        });
        await tx.outline_chapter.deleteMany({
          where: { outlineId },
        });

        // 2. 存储卷和章节
        let volumeSortOrder = 1;
        for (const volumeData of structure.volumes) {
          // 创建卷
          const volume = await tx.outline_volume.create({
            data: {
              outlineId,
              title: volumeData.title,
              description: volumeData.description,
              sortOrder: volumeSortOrder,
            },
          });

          // 创建卷下的章节
          let chapterSortOrder = 1;
          for (const chapterData of volumeData.chapters) {
            const chapter = await tx.outline_chapter.create({
              data: {
                volumeId: volume.id,
                title: chapterData.title,
                sortOrder: chapterSortOrder,
              },
            });

            // 如果有场景内容，存储到章节内容表
            if (chapterData.scenes.length > 0) {
              const sceneContent = chapterData.scenes.join('\n\n');
              await tx.outline_chapter_content.create({
                data: {
                  chapterId: chapter.id,
                  content: sceneContent,
                  version: 1,
                },
              });
            }

            chapterSortOrder++;
          }

          volumeSortOrder++;
        }

        // 3. 存储直接章节（无卷的章节）
        let directChapterSortOrder = 1;
        for (const chapterData of structure.directChapters) {
          const chapter = await tx.outline_chapter.create({
            data: {
              outlineId,
              title: chapterData.title,
              sortOrder: directChapterSortOrder,
            },
          });

          // 如果有场景内容，存储到章节内容表
          if (chapterData.scenes.length > 0) {
            const sceneContent = chapterData.scenes.join('\n\n');
            await tx.outline_chapter_content.create({
              data: {
                chapterId: chapter.id,
                content: sceneContent,
                version: 1,
              },
            });
          }

          directChapterSortOrder++;
        }
      });

      this.logger.debug(`[结构化存储完成] 大纲ID: ${outlineId}`);
    } catch (error) {
      this.logger.error(`[结构化存储失败] 大纲ID: ${outlineId}`, error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取大纲关联的所有设定详情
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @returns 关联的设定数据
   */
  async getOutlineSettings(outlineId: number, userId: string) {
    // 验证大纲所有权
    const outline = await this.findOne(outlineId, userId);
    if (!outline) {
      throw new NotFoundException('大纲不存在');
    }

    // 并行获取所有关联的设定
    const [characters, systems, worlds, misc] = await Promise.all([
      this.getCharactersByIds(outline.characters || []),
      this.getSystemsByIds(outline.systems || []),
      this.getWorldsByIds(outline.worlds || []),
      this.getMiscByIds(outline.misc || []),
    ]);

    return {
      characters,
      systems,
      worlds,
      misc,
    };
  }

  /**
   * 更新大纲关联的角色设定
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @param characterIds 角色设定 ID 数组
   */
  async updateOutlineCharacters(outlineId: number, userId: string, characterIds: number[]) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        characters: characterIds.map(String),
      },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      userId: updated.userId.toString(),
    };
  }

  /**
   * 更新大纲关联的系统设定
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @param systemIds 系统设定 ID 数组
   */
  async updateOutlineSystems(outlineId: number, userId: string, systemIds: number[]) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        systems: systemIds.map(String),
      },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      userId: updated.userId.toString(),
    };
  }

  /**
   * 更新大纲关联的世界设定
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @param worldIds 世界设定 ID 数组
   */
  async updateOutlineWorlds(outlineId: number, userId: string, worldIds: number[]) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        worlds: worldIds.map(String),
      },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      userId: updated.userId.toString(),
    };
  }

  /**
   * 更新大纲关联的辅助设定
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @param miscIds 辅助设定 ID 数组
   */
  async updateOutlineMisc(outlineId: number, userId: string, miscIds: number[]) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        misc: miscIds.map(String),
      },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      userId: updated.userId.toString(),
    };
  }

  /**
   * 根据 ID 列表获取角色设定
   * @param ids 角色设定 ID 数组（字符串格式）
   * @returns 角色设定列表
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
   * @param ids 系统设定 ID 数组（字符串格式）
   * @returns 系统设定列表
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
   * @param ids 世界设定 ID 数组（字符串格式）
   * @returns 世界设定列表
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
   * @param ids 辅助设定 ID 数组（字符串格式）
   * @returns 辅助设定列表
   */
  private async getMiscByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.misc_settings.findMany({
      where: {
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 创建新卷
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @param data 卷信息
   */
  async createVolume(
    outlineId: number,
    userId: string,
    data: { title: string; description?: string }
  ) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 敏感词检查
    const inputText = `${data.title} ${data.description || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    // 获取当前最大的 sortOrder
    const maxSortOrder = await this.prisma.outline_volume.findFirst({
      where: { outlineId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = maxSortOrder?.sortOrder ? Number(maxSortOrder.sortOrder) + 1 : 1;

    const volume = await this.prisma.outline_volume.create({
      data: {
        outlineId,
        title: data.title,
        description: data.description,
        sortOrder,
      },
    });

    return {
      ...volume,
      id: volume.id.toString(),
      outlineId: volume.outlineId.toString(),
    };
  }

  /**
   * 创建直接章节（无卷）
   * @param outlineId 大纲 ID
   * @param userId 用户 ID
   * @param data 章节信息
   */
  async createChapter(
    outlineId: number,
    userId: string,
    data: { title: string; content?: string }
  ) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 敏感词检查
    const inputText = `${data.title} ${data.content || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    // 获取当前最大的 sortOrder（仅针对直接章节）
    const maxSortOrder = await this.prisma.outline_chapter.findFirst({
      where: { outlineId, volumeId: null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = maxSortOrder?.sortOrder ? Number(maxSortOrder.sortOrder) + 1 : 1;

    const chapter = await this.prisma.outline_chapter.create({
      data: {
        outlineId,
        title: data.title,
        sortOrder,
      },
    });

    // 如果有内容，创建章节内容
    type ChapterContentType = {
      id: number;
      chapterId: number;
      content: string;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    };

    let chapterContent: ChapterContentType | null = null;
    if (data.content) {
      chapterContent = await this.prisma.outline_chapter_content.create({
        data: {
          chapterId: chapter.id,
          content: data.content,
          version: 1,
        },
      });
    }

    return {
      ...chapter,
      id: chapter.id.toString(),
      outlineId: chapter.outlineId?.toString() || null,
      volumeId: null,
      content: chapterContent
        ? {
            id: chapterContent.id.toString(),
            chapterId: chapterContent.chapterId.toString(),
            content: chapterContent.content,
            version: chapterContent.version,
            createdAt: chapterContent.createdAt,
            updatedAt: chapterContent.updatedAt,
          }
        : null,
    };
  }

  /**
   * 在指定卷下创建章节
   * @param outlineId 大纲 ID
   * @param volumeId 卷 ID
   * @param userId 用户 ID
   * @param data 章节信息
   */
  async createChapterInVolume(
    outlineId: number,
    volumeId: number,
    userId: string,
    data: { title: string; content?: string }
  ) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 验证卷是否属于该大纲
    const volume = await this.prisma.outline_volume.findFirst({
      where: { id: volumeId, outlineId },
    });

    if (!volume) {
      throw new NotFoundException('卷不存在或不属于该大纲');
    }

    // 敏感词检查
    const inputText = `${data.title} ${data.content || ''}`;
    const sensitiveCheckResult = this.sensitiveFilter.checkDetailed(
      inputText,
      FilterLevel.CREATIVE
    );
    if (sensitiveCheckResult.hasSensitive) {
      throw new BadRequestException(
        `输入内容包含不当词汇：${sensitiveCheckResult.sensitiveWords.join('、')}，请修改后重试`
      );
    }

    // 获取当前卷内最大的 sortOrder
    const maxSortOrder = await this.prisma.outline_chapter.findFirst({
      where: { volumeId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = maxSortOrder?.sortOrder ? Number(maxSortOrder.sortOrder) + 1 : 1;

    const chapter = await this.prisma.outline_chapter.create({
      data: {
        volumeId,
        title: data.title,
        sortOrder,
      },
    });

    // 如果有内容，创建章节内容
    type ChapterContentType = {
      id: number;
      chapterId: number;
      content: string;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    };

    let chapterContent: ChapterContentType | null = null;
    if (data.content) {
      chapterContent = await this.prisma.outline_chapter_content.create({
        data: {
          chapterId: chapter.id,
          content: data.content,
          version: 1,
        },
      });
    }

    return {
      ...chapter,
      id: chapter.id.toString(),
      outlineId: null,
      volumeId: chapter.volumeId?.toString() || null,
      content: chapterContent
        ? {
            id: chapterContent.id.toString(),
            chapterId: chapterContent.chapterId.toString(),
            content: chapterContent.content,
            version: chapterContent.version,
            createdAt: chapterContent.createdAt,
            updatedAt: chapterContent.updatedAt,
          }
        : null,
    };
  }

  /**
   * 删除卷（会同时删除卷下的所有章节）
   * @param outlineId 大纲 ID
   * @param volumeId 卷 ID
   * @param userId 用户 ID
   */
  async deleteVolume(outlineId: number, volumeId: number, userId: string) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 验证卷是否属于该大纲
    const volume = await this.prisma.outline_volume.findFirst({
      where: { id: volumeId, outlineId },
    });

    if (!volume) {
      throw new NotFoundException('卷不存在或不属于该大纲');
    }

    // 删除卷（级联删除章节会由数据库处理）
    await this.prisma.outline_volume.delete({
      where: { id: volumeId },
    });

    this.logger.debug(`[删除卷] 大纲ID: ${outlineId}, 卷ID: ${volumeId}`);
  }

  /**
   * 删除章节
   * @param outlineId 大纲 ID
   * @param chapterId 章节 ID
   * @param userId 用户 ID
   */
  async deleteChapter(outlineId: number, chapterId: number, userId: string) {
    // 验证大纲所有权
    await this.findOne(outlineId, userId);

    // 验证章节是否属于该大纲
    const chapter = await this.prisma.outline_chapter.findFirst({
      where: {
        id: chapterId,
        OR: [
          { outlineId },
          {
            volume: {
              outlineId,
            },
          },
        ],
      },
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在或不属于该大纲');
    }

    // 删除章节（级联删除内容会由数据库处理）
    await this.prisma.outline_chapter.delete({
      where: { id: chapterId },
    });

    this.logger.debug(`[删除章节] 大纲ID: ${outlineId}, 章节ID: ${chapterId}`);
  }
}
