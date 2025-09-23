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
import { SensitiveFilterService } from '../sensitive-filter/sensitive-filter.service';
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

  private async _generateStreamWithSubject(
    id: string,
    userId: string,
    subject: Subject<{ type: 'content' | 'complete'; data?: string }>,
    signal: AbortSignal
  ) {
    this.logger.debug(`[流开始] 大纲ID: ${id}, 用户ID: ${userId}`);
    let chunkCount = 0;
    let fullContent = ''; // 收集完整内容

    try {
      const outline = await this.findOne(parseInt(id, 10), userId);
      if (!outline) {
        throw new NotFoundException('大纲不存在或无权限访问');
      }

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
        },
        { configurable: { signal } }
      );

      for await (const chunk of stream) {
        if (signal.aborted) break;

        chunkCount++;
        fullContent += chunk; // 收集内容
        this.logger.debug(
          `[流数据块] 大纲ID: ${id}, 用户ID: ${userId}, 数据块长度: ${chunk.length}`
        );

        subject.next({ type: 'content', data: chunk });
      }

      if (signal.aborted) {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        this.logger.debug(`[流完成] 大纲ID: ${id}, 用户ID: ${userId}, 总数据块: ${chunkCount}`);

        // 流完成后自动保存并解析结构化数据
        await this.autoSaveAndParseContent(parseInt(id, 10), userId, fullContent);

        subject.next({ type: 'complete' });
      }
    } catch (error) {
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
      // 1. 保存内容到 outline_content 表
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

      // 2. 解析并存储结构化数据
      const parsedStructure = this.markdownParser.parseOutlineMarkdown(content);
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
    const { name, type, era, conflict, tags, remark } = data;

    // 用户输入敏感词检查 - 直接拒绝
    const inputText = `${name} ${type} ${era} ${conflict || ''} ${tags?.join(' ') || ''} ${remark || ''}`;
    if (this.sensitiveFilter.check(inputText)) {
      throw new BadRequestException('输入内容不符合法律法规，请修改后重试');
    }

    const outline = await this.prisma.outline.create({
      data: {
        name,
        type,
        era,
        conflict,
        tags,
        remark,
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
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        remark?: { contains: string; mode: 'insensitive' };
      }>;
      type?: string;
      era?: string;
      status?: Outline['status'];
      tags?: { hasSome: string[] };
    } = {
      userId: parseInt(userId),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { remark: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;

    if (era) where.era = era;

    if (status) where.status = status;

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
      const parsedStructure = this.markdownParser.parseOutlineMarkdown(content);
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

    // 用户输入敏感词检查 - 直接拒绝
    const { name, type, era, conflict, tags, remark } = data;
    const inputText = `${name || ''} ${type || ''} ${era || ''} ${conflict || ''} ${tags?.join(' ') || ''} ${remark || ''}`;
    if (this.sensitiveFilter.check(inputText)) {
      throw new BadRequestException('输入内容不符合法律法规，请修改后重试');
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

  async delete(id: number, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.outline.delete({
      where: { id },
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
}
