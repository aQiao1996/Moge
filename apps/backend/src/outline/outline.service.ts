import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  BadRequestException,
  HttpException,
  MessageEvent,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOutlineValues, UpdateOutlineValues, Outline } from '@moge/types';
import { BaseService } from '../base/base.service';
import { AIService } from '../ai/ai.service';
import type { AIStreamingDebugInfo } from '../ai/ai.service';
import { Observable, Subject } from 'rxjs';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SensitiveFilterService, FilterLevel } from '../sensitive-filter/sensitive-filter.service';
import { SYSTEM_PROMPT, USER_PROMPT } from './prompts/outline.prompt';
import { MarkdownParserService, ParsedOutlineStructure } from './markdown-parser.service';
import type { OutlineChapterInput, OutlineVolumeInput } from './outline.schemas';
import { Prisma } from '../../generated/prisma';

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

interface OutlineStreamEvent {
  type: 'content' | 'complete' | 'heartbeat';
  data?: string;
}

interface OutlineStreamErrorPayload {
  error: {
    message: string;
    code: string;
  };
}

interface NormalizedOutlineStreamError {
  name?: string;
  message?: string;
  status?: number;
  code?: string;
  type?: string;
  requestId?: string;
}

type OutlineDbClient = PrismaService | Prisma.TransactionClient;

interface TransactionLock {
  namespace: number;
  scopeId: number;
}

const OUTLINE_LOCK_NAMESPACE = 2001;

@Injectable()
export class OutlineService extends BaseService {
  private readonly logger = new Logger(OutlineService.name);
  private readonly STREAM_TIMEOUT = 120000; // 120 s
  private readonly HEARTBEAT_INTERVAL = 15000; // 15 s

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly sensitiveFilter: SensitiveFilterService,
    private readonly markdownParser: MarkdownParserService
  ) {
    super();
  }

  private parseUserId(userId: string): number {
    const numericUserId = Number(userId);

    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException('用户信息无效');
    }

    return numericUserId;
  }

  private normalizeSettingIds(ids: number[]): number[] {
    return Array.from(
      new Set(
        ids.map((id) => {
          if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException('设定 ID 格式不正确');
          }

          return id;
        })
      )
    );
  }

  private getOutlineLock(outlineId: number): TransactionLock {
    return {
      namespace: OUTLINE_LOCK_NAMESPACE,
      scopeId: outlineId,
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
    outlineId: number,
    operation: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await this.acquireTransactionLocks(tx, [this.getOutlineLock(outlineId)]);
      return operation(tx);
    });
  }

  private async saveOutlineContentRecord(
    prismaClient: OutlineDbClient,
    outlineId: number,
    content: string
  ) {
    const existingContent = await prismaClient.outline_content.findUnique({
      where: { outlineId },
    });

    if (existingContent) {
      await prismaClient.outline_content_version.create({
        data: {
          contentId: existingContent.id,
          version: existingContent.version,
          content: existingContent.content,
        },
      });

      return prismaClient.outline_content.update({
        where: { outlineId },
        data: {
          content,
          version: existingContent.version + 1,
        },
      });
    }

    return prismaClient.outline_content.create({
      data: {
        outlineId,
        content,
        version: 1,
      },
    });
  }

  private async saveOutlineChapterContentRecord(
    prismaClient: OutlineDbClient,
    chapterId: number,
    content: string
  ) {
    const existingContent = await prismaClient.outline_chapter_content.findUnique({
      where: { chapterId },
    });

    if (existingContent) {
      await prismaClient.outline_chapter_content_version.create({
        data: {
          contentId: existingContent.id,
          version: existingContent.version,
          content: existingContent.content,
        },
      });

      return prismaClient.outline_chapter_content.update({
        where: { chapterId },
        data: {
          content,
          version: existingContent.version + 1,
        },
      });
    }

    return prismaClient.outline_chapter_content.create({
      data: {
        chapterId,
        content,
        version: 1,
      },
    });
  }

  private async replaceStructuredOutline(
    prismaClient: OutlineDbClient,
    outlineId: number,
    structure: ParsedOutlineStructure
  ): Promise<void> {
    await prismaClient.outline_volume.deleteMany({
      where: { outlineId },
    });
    await prismaClient.outline_chapter.deleteMany({
      where: { outlineId },
    });

    let volumeSortOrder = 1;
    for (const volumeData of structure.volumes) {
      const volume = await prismaClient.outline_volume.create({
        data: {
          outlineId,
          title: volumeData.title,
          description: volumeData.description,
          sortOrder: volumeSortOrder,
        },
      });

      let chapterSortOrder = 1;
      for (const chapterData of volumeData.chapters) {
        const chapter = await prismaClient.outline_chapter.create({
          data: {
            volumeId: volume.id,
            title: chapterData.title,
            sortOrder: chapterSortOrder,
          },
        });

        if (chapterData.scenes.length > 0) {
          await this.saveOutlineChapterContentRecord(
            prismaClient,
            chapter.id,
            chapterData.scenes.join('\n\n')
          );
        }

        chapterSortOrder++;
      }

      volumeSortOrder++;
    }

    let directChapterSortOrder = 1;
    for (const chapterData of structure.directChapters) {
      const chapter = await prismaClient.outline_chapter.create({
        data: {
          outlineId,
          title: chapterData.title,
          sortOrder: directChapterSortOrder,
        },
      });

      if (chapterData.scenes.length > 0) {
        await this.saveOutlineChapterContentRecord(
          prismaClient,
          chapter.id,
          chapterData.scenes.join('\n\n')
        );
      }

      directChapterSortOrder++;
    }
  }

  private async assertOutlineCharactersOwned(userId: string, ids: number[]) {
    const numericUserId = this.parseUserId(userId);
    const normalizedIds = this.normalizeSettingIds(ids);

    if (normalizedIds.length === 0) {
      return normalizedIds;
    }

    const count = await this.prisma.character_settings.count({
      where: {
        userId: numericUserId,
        id: { in: normalizedIds },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分角色设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertOutlineSystemsOwned(userId: string, ids: number[]) {
    const numericUserId = this.parseUserId(userId);
    const normalizedIds = this.normalizeSettingIds(ids);

    if (normalizedIds.length === 0) {
      return normalizedIds;
    }

    const count = await this.prisma.system_settings.count({
      where: {
        userId: numericUserId,
        id: { in: normalizedIds },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分系统设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertOutlineWorldsOwned(userId: string, ids: number[]) {
    const numericUserId = this.parseUserId(userId);
    const normalizedIds = this.normalizeSettingIds(ids);

    if (normalizedIds.length === 0) {
      return normalizedIds;
    }

    const count = await this.prisma.world_settings.count({
      where: {
        userId: numericUserId,
        id: { in: normalizedIds },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分世界设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertOutlineMiscOwned(userId: string, ids: number[]) {
    const numericUserId = this.parseUserId(userId);
    const normalizedIds = this.normalizeSettingIds(ids);

    if (normalizedIds.length === 0) {
      return normalizedIds;
    }

    const count = await this.prisma.misc_settings.count({
      where: {
        userId: numericUserId,
        id: { in: normalizedIds },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分辅助设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  /**
   * 流式生成大纲内容
   * @param id 大纲 ID
   * @param userId 用户 ID
   * @returns 包含流式数据的 Observable
   */
  generateContentStream(id: string, userId: string): Observable<MessageEvent> {
    const subject = new Subject<OutlineStreamEvent>();

    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort('timeout');
    }, this.STREAM_TIMEOUT);
    const heartbeatTimer = setInterval(() => {
      if (!subject.closed) {
        subject.next({ type: 'heartbeat' });
      }
    }, this.HEARTBEAT_INTERVAL);

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
          } else if (data.type === 'heartbeat') {
            observer.next({ type: 'heartbeat', data: null });
          } else {
            observer.next({ type: 'content', data: data.data });
          }
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      });

      return () => {
        clearTimeout(timeout);
        clearInterval(heartbeatTimer);
        abortController.abort('cleanup');
        sub.unsubscribe();
      };
    });
  }

  // 定义自适应分发的配置
  private readonly INITIAL_DRIP_CHUNK_SIZE = 8; // 刚开始保留“正在生成”的观感
  private readonly ACCELERATED_DRIP_CHUNK_SIZE = 24; // 缓冲积压后自动提速
  private readonly FINISHING_DRIP_CHUNK_SIZE = 96; // 上游结束后快速清空缓冲
  private readonly INITIAL_DRIP_INTERVAL = 45; // 初始阶段稍慢，保留打字机效果
  private readonly ACCELERATED_DRIP_INTERVAL = 18; // 中段加速，避免用户误以为卡住
  private readonly FINISHING_DRIP_INTERVAL = 4; // 收尾尽快完成，避免按钮长期停在“生成中”
  private readonly PUNCTUATION_DELAY = 70; // 遇到标点稍作停顿，让阅读节奏更自然
  private readonly IDLE_WAIT_INTERVAL = 50; // 缓冲区为空时的轮询间隔

  /**
   * 缓冲区分发器
   * @param subject RxJS Subject 用于将数据推送到客户端
   * @param bufferRef 引用对象，包含需要发送的字符串缓冲区
   * @param isStreamFinishedRef 引用对象，标记上游 AI 流是否已结束
   * @param signal 中止信号，用于提前终止
   */
  private async _dripFeedBufferToSubject(
    subject: Subject<OutlineStreamEvent>,
    bufferRef: { current: string },
    isStreamFinishedRef: { current: boolean },
    signal: AbortSignal
  ) {
    let emittedChars = 0;

    while (!signal.aborted) {
      if (bufferRef.current.length > 0) {
        const strategy = this.resolveDripStrategy(
          bufferRef.current.length,
          emittedChars,
          isStreamFinishedRef.current
        );

        // 从缓冲区取出当前策略对应的小批量字符
        const dripChunk = bufferRef.current.substring(0, strategy.chunkSize);
        bufferRef.current = bufferRef.current.substring(dripChunk.length);
        emittedChars += dripChunk.length;

        // 推送给前端
        subject.next({ type: 'content', data: dripChunk });

        // 检查块的最后一个字符是否为标点，以实现智能延迟
        const lastChar = dripChunk.slice(-1);
        const delay = this.resolveDripDelay(
          lastChar,
          bufferRef.current.length,
          isStreamFinishedRef.current,
          strategy.interval
        );

        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } else if (isStreamFinishedRef.current) {
        // 如果上游流已结束，且缓冲区已清空，则退出循环
        break;
      } else {
        // 如果缓冲区为空，但上游流尚未结束，则稍作等待，避免空转
        await new Promise((resolve) => setTimeout(resolve, this.IDLE_WAIT_INTERVAL));
      }
    }
  }

  private resolveDripStrategy(
    pendingLength: number,
    emittedChars: number,
    isStreamFinished: boolean
  ): { chunkSize: number; interval: number } {
    if (isStreamFinished || pendingLength >= 600) {
      return {
        chunkSize: this.FINISHING_DRIP_CHUNK_SIZE,
        interval: this.FINISHING_DRIP_INTERVAL,
      };
    }

    if (pendingLength >= 180 || emittedChars >= 320) {
      return {
        chunkSize: this.ACCELERATED_DRIP_CHUNK_SIZE,
        interval: this.ACCELERATED_DRIP_INTERVAL,
      };
    }

    return {
      chunkSize: this.INITIAL_DRIP_CHUNK_SIZE,
      interval: this.INITIAL_DRIP_INTERVAL,
    };
  }

  private resolveDripDelay(
    lastChar: string,
    pendingLength: number,
    isStreamFinished: boolean,
    baseInterval: number
  ): number {
    if (isStreamFinished && pendingLength > this.FINISHING_DRIP_CHUNK_SIZE * 2) {
      return 0;
    }

    if (isStreamFinished) {
      return this.FINISHING_DRIP_INTERVAL;
    }

    if (['。', '！', '？', '，', '；', '、', '\n'].includes(lastChar)) {
      return baseInterval + this.PUNCTUATION_DELAY;
    }

    return baseInterval;
  }

  private async _generateStreamWithSubject(
    id: string,
    userId: string,
    subject: Subject<OutlineStreamEvent>,
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

      // ⭐ 获取关联的设定作为上下文
      const settings = await this.getOutlineSettings(parseInt(id, 10), userId);
      const settingsContext = this.buildSettingsContext(settings);

      const model = this.aiService.getDefaultStreamingModel();
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
      await dripPromise;

      const errorPayload = this.buildStreamErrorPayload(error, signal);

      if (!errorPayload) {
        this.logger.warn(`[流已中止] 大纲ID: ${id}, 用户ID: ${userId}, 原因: ${signal.reason}`);
      } else {
        this.logStreamError(id, userId, error, signal, errorPayload);
        subject.next({ type: 'content', data: JSON.stringify(errorPayload) });
      }
    } finally {
      this.logger.debug(`[流结束] 大纲ID: ${id}, 用户ID: ${userId}`);
      if (!subject.closed) {
        subject.complete();
      }
    }
  }

  private buildStreamErrorPayload(
    error: unknown,
    signal: AbortSignal
  ): OutlineStreamErrorPayload | null {
    const normalizedError = this.normalizeStreamError(error);

    if (normalizedError.name === 'AbortError') {
      if (signal.reason === 'timeout') {
        return {
          error: {
            message: 'AI 生成超时，请稍后重试。',
            code: 'AI_TIMEOUT',
          },
        };
      }

      return null;
    }

    if (
      signal.reason === 'timeout' ||
      normalizedError.name === 'TimeoutError' ||
      this.messageIncludes(normalizedError.message, ['timed out', 'timeout'])
    ) {
      return {
        error: {
          message: 'AI 生成超时，请稍后重试。',
          code: 'AI_TIMEOUT',
        },
      };
    }

    if (error instanceof NotFoundException) {
      return {
        error: {
          message: this.getHttpExceptionMessage(error) ?? '大纲不存在或无权限访问',
          code: 'OUTLINE_NOT_FOUND',
        },
      };
    }

    if (error instanceof ForbiddenException) {
      return {
        error: {
          message: this.getHttpExceptionMessage(error) ?? '无权访问此大纲',
          code: 'OUTLINE_ACCESS_DENIED',
        },
      };
    }

    if (error instanceof BadRequestException) {
      return {
        error: {
          message: this.getHttpExceptionMessage(error) ?? '请求参数有误，请检查后重试。',
          code: 'OUTLINE_REQUEST_ERROR',
        },
      };
    }

    if (normalizedError.status === 429 || normalizedError.code === 'MODEL_RATE_LIMIT') {
      return {
        error: {
          message: '您的请求过于频繁或已超出额度，请稍后再试。',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      };
    }

    if (
      normalizedError.status === 401 ||
      normalizedError.status === 403 ||
      normalizedError.code === 'MODEL_AUTHENTICATION'
    ) {
      return {
        error: {
          message: 'AI 服务鉴权失败，请检查密钥或中转站权限配置。',
          code: 'AI_AUTH_ERROR',
        },
      };
    }

    if (this.isAIConfigError(normalizedError.message)) {
      return {
        error: {
          message: 'AI 服务配置不完整，请检查环境变量配置。',
          code: 'AI_CONFIG_ERROR',
        },
      };
    }

    if (normalizedError.status === 404 || normalizedError.code === 'MODEL_NOT_FOUND') {
      return {
        error: {
          message: '当前配置的 AI 模型不存在或不可用，请检查模型名称。',
          code: 'AI_MODEL_NOT_FOUND',
        },
      };
    }

    if (normalizedError.status === 400 || normalizedError.status === 422) {
      return {
        error: {
          message: 'AI 请求参数不被当前模型或中转站支持，请检查模型与参数配置。',
          code: 'AI_REQUEST_ERROR',
        },
      };
    }

    if (
      (normalizedError.status !== undefined && normalizedError.status >= 500) ||
      this.messageIncludes(normalizedError.message, [
        'no clients available',
        'connection error',
        'fetch failed',
        'service unavailable',
        'bad gateway',
        'gateway timeout',
      ])
    ) {
      return {
        error: {
          message: 'AI 服务暂时不可用，请稍后重试。',
          code: 'AI_PROVIDER_ERROR',
        },
      };
    }

    return {
      error: {
        message: '生成大纲时发生未知错误，请稍后重试。',
        code: 'UNKNOWN_ERROR',
      },
    };
  }

  private logStreamError(
    outlineId: string,
    userId: string,
    error: unknown,
    signal: AbortSignal,
    errorPayload: OutlineStreamErrorPayload
  ) {
    const normalizedError = this.normalizeStreamError(error);
    const aiDebugInfo = this.aiService.getDefaultStreamingDebugInfo();
    const logMessage = JSON.stringify({
      outlineId,
      userId,
      abortReason: typeof signal.reason === 'string' ? signal.reason : undefined,
      ai: this.buildSafeAIDebugInfo(aiDebugInfo),
      errorCode: errorPayload.error.code,
      errorName: normalizedError.name,
      status: normalizedError.status,
      upstreamCode: normalizedError.code,
      upstreamType: normalizedError.type,
      requestId: normalizedError.requestId,
      message: normalizedError.message,
    });

    if (error instanceof Error) {
      this.logger.error(`[流错误] ${logMessage}`, error.stack);
      return;
    }

    this.logger.error(`[流错误] ${logMessage}`);
  }

  private buildSafeAIDebugInfo(aiDebugInfo: AIStreamingDebugInfo) {
    return {
      provider: aiDebugInfo.provider,
      modelName: aiDebugInfo.modelName,
      baseURL: aiDebugInfo.baseURL,
    };
  }

  private normalizeStreamError(error: unknown, depth = 0): NormalizedOutlineStreamError {
    if (depth > 3 || !this.isErrorRecord(error)) {
      return {};
    }

    const nestedError = this.isErrorRecord(error.error) ? error.error : undefined;
    const nestedCause = error.cause;
    const normalizedNestedError = nestedError
      ? this.normalizeStreamError(nestedError, depth + 1)
      : {};
    const normalizedCause = nestedCause ? this.normalizeStreamError(nestedCause, depth + 1) : {};

    return {
      name:
        this.getStringValue(error, 'name') ?? normalizedCause.name ?? normalizedNestedError.name,
      message:
        this.getStringValue(error, 'message') ??
        normalizedNestedError.message ??
        normalizedCause.message,
      status:
        this.getNumberValue(error, 'status') ??
        this.getNumberValue(error, 'statusCode') ??
        normalizedNestedError.status ??
        normalizedCause.status,
      code:
        this.getStringValue(error, 'code') ??
        this.getStringValue(error, 'lc_error_code') ??
        normalizedNestedError.code ??
        normalizedCause.code,
      type:
        this.getStringValue(error, 'type') ?? normalizedNestedError.type ?? normalizedCause.type,
      requestId:
        this.getStringValue(error, 'requestID') ??
        this.getStringValue(error, 'requestId') ??
        normalizedCause.requestId,
    };
  }

  private getHttpExceptionMessage(error: HttpException): string | undefined {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (!this.isErrorRecord(response)) {
      return error.message;
    }

    const responseMessage = response.message;
    if (typeof responseMessage === 'string') {
      return responseMessage;
    }

    if (Array.isArray(responseMessage)) {
      const messageList = responseMessage.filter(
        (message): message is string => typeof message === 'string'
      );

      if (messageList.length > 0) {
        return messageList.join('；');
      }
    }

    return error.message;
  }

  private isAIConfigError(message?: string): boolean {
    return this.messageIncludes(message, [
      'ai 提供商配置错误',
      '缺少 ai 配置项',
      'missing api key',
      'api key is required',
      'api key missing',
      'missing openai_api_key',
      'missing google api key',
    ]);
  }

  private messageIncludes(message: string | undefined, keywords: string[]): boolean {
    if (!message) {
      return false;
    }

    const normalizedMessage = message.toLowerCase();
    return keywords.some((keyword) => normalizedMessage.includes(keyword));
  }

  private isErrorRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getStringValue(source: Record<string, unknown>, key: string): string | undefined {
    const value = source[key];
    return typeof value === 'string' ? value : undefined;
  }

  private getNumberValue(source: Record<string, unknown>, key: string): number | undefined {
    const value = source[key];
    return typeof value === 'number' ? value : undefined;
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
      const parsedStructure = await this.markdownParser.parseOutlineMarkdown(content);

      if (this.markdownParser.validateParsedStructure(parsedStructure)) {
        try {
          await this.runLockedTransaction(outlineId, async (tx) => {
            await this.saveOutlineContentRecord(tx, outlineId, content);
            await this.replaceStructuredOutline(tx, outlineId, parsedStructure);
          });

          this.logger.debug(`[自动保存完成] 大纲ID: ${outlineId}, 已存储结构化数据`);
          return;
        } catch (error) {
          this.logger.error(`[自动保存结构化存储失败] 大纲ID: ${outlineId}`, error);
        }
      } else {
        this.logger.warn(`[自动保存警告] 大纲ID: ${outlineId}, 结构化数据不合理`);
      }

      await this.runLockedTransaction(outlineId, async (tx) => {
        await this.saveOutlineContentRecord(tx, outlineId, content);
      });
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

    if (!outline) {
      throw new NotFoundException('大纲不存在');
    }

    if (outline.userId !== this.parseUserId(userId)) {
      throw new ForbiddenException('无权访问此大纲');
    }

    // 转换为前端期望的字符串格式
    return {
      ...outline,
      id: outline.id.toString(),
      userId: outline.userId.toString(),
    };
  }

  async findDetail(id: number, userId: string) {
    // 先检查权限
    const outline = await this.prisma.outline.findUnique({
      where: { id },
    });

    if (!outline) {
      throw new NotFoundException('大纲不存在');
    }

    if (outline.userId !== this.parseUserId(userId)) {
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

    let parsedStructure: ParsedOutlineStructure | null = null;
    try {
      const candidateStructure = await this.markdownParser.parseOutlineMarkdown(content);
      if (this.markdownParser.validateParsedStructure(candidateStructure)) {
        parsedStructure = candidateStructure;
      } else {
        this.logger.warn(`[解析失败] 大纲ID: ${id}, 结构化数据不合理`);
      }
    } catch (error) {
      this.logger.error(`[解析异常] 大纲ID: ${id}`, error);
    }

    let result: Awaited<ReturnType<OutlineService['saveOutlineContentRecord']>>;
    if (parsedStructure) {
      try {
        result = await this.runLockedTransaction(id, async (tx) => {
          const savedContent = await this.saveOutlineContentRecord(tx, id, content);
          await this.replaceStructuredOutline(tx, id, parsedStructure);
          return savedContent;
        });
        this.logger.debug(`[解析成功] 大纲ID: ${id}, 已存储结构化数据`);
      } catch (error) {
        this.logger.error(`[结构化存储失败] 大纲ID: ${id}`, error);
        result = await this.runLockedTransaction(id, async (tx) => {
          return this.saveOutlineContentRecord(tx, id, content);
        });
      }
    } else {
      result = await this.runLockedTransaction(id, async (tx) => {
        return this.saveOutlineContentRecord(tx, id, content);
      });
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
    data: OutlineVolumeInput
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

    const updatedVolume = await this.runLockedTransaction(outlineId, async (tx) => {
      const currentVolume = await tx.outline_volume.findFirst({
        where: {
          id: volumeId,
          outlineId,
        },
      });

      if (!currentVolume) {
        throw new NotFoundException('卷不存在或不属于该大纲');
      }

      return tx.outline_volume.update({
        where: { id: volumeId },
        data: {
          title: data.title,
          description: data.description,
        },
      });
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
    data: OutlineChapterInput
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

    const { updatedChapter, chapterContentResult } = await this.runLockedTransaction(
      outlineId,
      async (tx) => {
        const currentChapter = await tx.outline_chapter.findFirst({
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

        if (!currentChapter) {
          throw new NotFoundException('章节不存在或不属于该大纲');
        }

        const updatedChapter = await tx.outline_chapter.update({
          where: { id: chapterId },
          data: {
            title: data.title,
          },
        });

        const chapterContentResult =
          data.content !== undefined
            ? await this.saveOutlineChapterContentRecord(tx, chapterId, data.content)
            : null;

        return {
          updatedChapter,
          chapterContentResult,
        };
      }
    );

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
      await this.runLockedTransaction(outlineId, async (tx) => {
        await this.replaceStructuredOutline(tx, outlineId, structure);
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

    // 并行获取所有关联的设定
    const [characters, systems, worlds, misc] = await Promise.all([
      this.getCharactersByIds(outline.characters || [], userId),
      this.getSystemsByIds(outline.systems || [], userId),
      this.getWorldsByIds(outline.worlds || [], userId),
      this.getMiscByIds(outline.misc || [], userId),
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
    const normalizedIds = await this.assertOutlineCharactersOwned(userId, characterIds);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        characters: normalizedIds.map(String),
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
    const normalizedIds = await this.assertOutlineSystemsOwned(userId, systemIds);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        systems: normalizedIds.map(String),
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
    const normalizedIds = await this.assertOutlineWorldsOwned(userId, worldIds);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        worlds: normalizedIds.map(String),
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
    const normalizedIds = await this.assertOutlineMiscOwned(userId, miscIds);

    // 更新关联
    const updated = await this.prisma.outline.update({
      where: { id: outlineId },
      data: {
        misc: normalizedIds.map(String),
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
  private async getCharactersByIds(ids: string[], userId: string) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.character_settings.findMany({
      where: {
        userId: this.parseUserId(userId),
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取系统设定
   * @param ids 系统设定 ID 数组（字符串格式）
   * @returns 系统设定列表
   */
  private async getSystemsByIds(ids: string[], userId: string) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.system_settings.findMany({
      where: {
        userId: this.parseUserId(userId),
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取世界设定
   * @param ids 世界设定 ID 数组（字符串格式）
   * @returns 世界设定列表
   */
  private async getWorldsByIds(ids: string[], userId: string) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.world_settings.findMany({
      where: {
        userId: this.parseUserId(userId),
        id: { in: ids.map(Number) },
      },
    });
  }

  /**
   * 根据 ID 列表获取辅助设定
   * @param ids 辅助设定 ID 数组（字符串格式）
   * @returns 辅助设定列表
   */
  private async getMiscByIds(ids: string[], userId: string) {
    if (!ids || ids.length === 0) return [];
    return this.prisma.misc_settings.findMany({
      where: {
        userId: this.parseUserId(userId),
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
  async createVolume(outlineId: number, userId: string, data: OutlineVolumeInput) {
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

    const volume = await this.runLockedTransaction(outlineId, async (tx) => {
      const maxSortOrder = await tx.outline_volume.findFirst({
        where: { outlineId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const sortOrder = maxSortOrder?.sortOrder ? Number(maxSortOrder.sortOrder) + 1 : 1;

      return tx.outline_volume.create({
        data: {
          outlineId,
          title: data.title,
          description: data.description,
          sortOrder,
        },
      });
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
  async createChapter(outlineId: number, userId: string, data: OutlineChapterInput) {
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

    const { chapter, chapterContent } = await this.runLockedTransaction(outlineId, async (tx) => {
      const maxSortOrder = await tx.outline_chapter.findFirst({
        where: { outlineId, volumeId: null },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const sortOrder = maxSortOrder?.sortOrder ? Number(maxSortOrder.sortOrder) + 1 : 1;

      const chapter = await tx.outline_chapter.create({
        data: {
          outlineId,
          title: data.title,
          sortOrder,
        },
      });

      const chapterContent = data.content
        ? await this.saveOutlineChapterContentRecord(tx, chapter.id, data.content)
        : null;

      return {
        chapter,
        chapterContent,
      };
    });

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
    data: OutlineChapterInput
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

    const { chapter, chapterContent } = await this.runLockedTransaction(outlineId, async (tx) => {
      const currentVolume = await tx.outline_volume.findFirst({
        where: { id: volumeId, outlineId },
      });

      if (!currentVolume) {
        throw new NotFoundException('卷不存在或不属于该大纲');
      }

      const maxSortOrder = await tx.outline_chapter.findFirst({
        where: { volumeId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const sortOrder = maxSortOrder?.sortOrder ? Number(maxSortOrder.sortOrder) + 1 : 1;

      const chapter = await tx.outline_chapter.create({
        data: {
          volumeId,
          title: data.title,
          sortOrder,
        },
      });

      const chapterContent = data.content
        ? await this.saveOutlineChapterContentRecord(tx, chapter.id, data.content)
        : null;

      return {
        chapter,
        chapterContent,
      };
    });

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

    await this.runLockedTransaction(outlineId, async (tx) => {
      const currentVolume = await tx.outline_volume.findFirst({
        where: { id: volumeId, outlineId },
      });

      if (!currentVolume) {
        throw new NotFoundException('卷不存在或不属于该大纲');
      }

      await tx.outline_volume.delete({
        where: { id: volumeId },
      });
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

    await this.runLockedTransaction(outlineId, async (tx) => {
      const currentChapter = await tx.outline_chapter.findFirst({
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

      if (!currentChapter) {
        throw new NotFoundException('章节不存在或不属于该大纲');
      }

      await tx.outline_chapter.delete({
        where: { id: chapterId },
      });
    });

    this.logger.debug(`[删除章节] 大纲ID: ${outlineId}, 章节ID: ${chapterId}`);
  }
}
