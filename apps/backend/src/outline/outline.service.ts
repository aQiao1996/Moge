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
  private readonly STREAM_DONE_SIGNAL = '__DONE__';
  private readonly STREAM_TIMEOUT = 120000; // 120 s

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly sensitiveFilter: SensitiveFilterService
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
            observer.next({ data: JSON.stringify({ type: 'complete' }) });
          } else {
            observer.next({ data: JSON.stringify({ type: 'content', data: data.data }) });
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
        this.logger.debug(
          `[流数据块] 大纲ID: ${id}, 用户ID: ${userId}, 数据块长度: ${chunk.length}`
        );

        subject.next({ type: 'content', data: chunk });
      }

      if (signal.aborted) {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        this.logger.debug(`[流完成] 大纲ID: ${id}, 用户ID: ${userId}, 总数据块: ${chunkCount}`);
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
}
