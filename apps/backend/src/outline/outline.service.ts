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
import { Observable, Subscriber } from 'rxjs';
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
  private readonly STREAM_TIMEOUT = 120000; // 120 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly sensitiveFilter: SensitiveFilterService
  ) {
    super();
  }

  /**
   * 流式生成大纲内容 - 生产级加固版
   * @param id 大纲 ID
   * @param userId 用户 ID
   * @returns 一个包含 SSE 事件的 Observable
   */
  generateContentStream(id: string, userId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const ac = new AbortController();
      const { signal } = ac;
      let timeoutId: NodeJS.Timeout | null = null;

      // 重置超时定时器
      const resetTimeout = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (!ac.signal.aborted) {
            ac.abort('timeout'); // 发出超时中断信号
          }
        }, this.STREAM_TIMEOUT);
      };

      // 启动初始超时
      resetTimeout();

      // 异步执行流生成逻辑
      this._generateStream(id, userId, subscriber, signal, resetTimeout).catch((error) => {
        if (!subscriber.closed) {
          subscriber.error(error);
        }
      });

      // 清理逻辑：当 Observable 被取消订阅时（如客户端断开连接）执行
      return () => {
        if (!ac.signal.aborted) {
          this.logger.warn(
            `[客户端断开连接] 正在中止流，大纲ID: ${id}, 用户ID: ${userId}`,
            'client_disconnect'
          );
          ac.abort('client_disconnect');
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    });
  }

  private async _generateStream(
    id: string,
    userId: string,
    subscriber: Subscriber<MessageEvent>,
    signal: AbortSignal,
    resetTimeout: () => void
  ) {
    this.logger.debug(`[流开始] 大纲ID: ${id}, 用户ID: ${userId}`);
    let chunkCount = 0;

    try {
      // 验证权限并获取大纲
      const outline = await this.findOne(parseInt(id, 10), userId);
      if (!outline) {
        throw new NotFoundException('大纲不存在或无权限访问');
      }

      // AI生成内容的敏感词过滤会在输出时处理
      // 这里直接使用原始数据进行生成

      // 实例化模型和 Prompt
      const model = this.aiService.getStreamingModel('gemini');
      const prompt = this.createPromptTemplate();
      const chain = prompt.pipe(model).pipe(new StringOutputParser());

      // 获取并处理流
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
        { configurable: { signal } } // 将 AbortSignal 传递给 LangChain
      );

      // for-await-of 处理了背压,是"拉"的一种模式
      for await (const chunk of stream) {
        if (signal.aborted) break; // 双重保险

        resetTimeout(); // 收到新数据，重置超时
        chunkCount++;
        this.logger.debug(
          `[流数据块] 大纲ID: ${id}, 用户ID: ${userId}, 数据块长度: ${chunk.length}`
        );

        // 对AI生成的内容进行敏感词过滤
        const filteredChunk = this.sensitiveFilter.replace(chunk);
        const safeChunk = typeof filteredChunk.text === 'string' ? filteredChunk.text : chunk;

        if (!filteredChunk.pass) {
          console.log('🚀 ~ AI生成内容检测到敏感词并已过滤:', filteredChunk.filter);
        }

        subscriber.next({ data: safeChunk });
      }

      if (signal.aborted) {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        // 发送结束信号
        subscriber.next({ data: this.STREAM_DONE_SIGNAL });
        this.logger.debug(`[流完成] 大纲ID: ${id}, 用户ID: ${userId}, 总数据块: ${chunkCount}`);
      }
    } catch (error) {
      // 特别处理 AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        if (error instanceof Error) {
          this.logger.error(`[流错误] 大纲ID: ${id}, 用户ID: ${userId}`, error.stack);
        } else {
          this.logger.error(`[流错误] 大纲ID: ${id}, 用户ID: ${userId}`, error);
        }
        if (!subscriber.closed) {
          subscriber.error(error);
        }
      }
    } finally {
      this.logger.debug(`[流结束] 大纲ID: ${id}, 用户ID: ${userId}`);
      if (!subscriber.closed) {
        subscriber.complete(); // 确保流在任何情况下都能关闭
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
