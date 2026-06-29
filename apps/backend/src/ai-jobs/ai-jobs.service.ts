import { Injectable } from '@nestjs/common';
import type { AiJob, AiJobEvent } from '@moge/types';
import { AiJobStatus, type AiTaskType, type Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

type AiJobWithEvents = Prisma.ai_jobsGetPayload<{
  include: {
    events: {
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

export interface CreateAiJobInput {
  projectId?: number | null;
  outlineId?: number | null;
  manuscriptId?: number | null;
  chapterId?: number | null;
  taskType: AiTaskType;
  status?: AiJobStatus;
  priority?: number;
  provider?: string | null;
  model?: string | null;
  presetId?: number | null;
  presetVersion?: number | null;
  inputPayload?: Prisma.InputJsonValue | null;
  contextMeta?: Prisma.InputJsonValue | null;
  maxRetries?: number;
}

export interface ListAiJobsOptions {
  limit?: number;
  status?: AiJobStatus;
}

interface ClaimedJobIdRow {
  id: number;
}

const JOB_EVENTS_ORDER_BY = {
  createdAt: 'asc',
} as const;

const CANCELLABLE_JOB_STATUSES = [AiJobStatus.PENDING, AiJobStatus.QUEUED, AiJobStatus.RUNNING];
const RETRYABLE_JOB_STATUSES = [AiJobStatus.FAILED, AiJobStatus.CANCELED];

@Injectable()
export class AiJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(userId: number, input: CreateAiJobInput): Promise<AiJob> {
    const job = await this.prisma.ai_jobs.create({
      data: {
        userId,
        projectId: input.projectId ?? null,
        outlineId: input.outlineId ?? null,
        manuscriptId: input.manuscriptId ?? null,
        chapterId: input.chapterId ?? null,
        taskType: input.taskType,
        status: input.status ?? AiJobStatus.QUEUED,
        priority: input.priority ?? 0,
        provider: input.provider ?? null,
        model: input.model ?? null,
        presetId: input.presetId ?? null,
        presetVersion: input.presetVersion ?? null,
        inputPayload: input.inputPayload ?? null,
        contextMeta: input.contextMeta ?? null,
        maxRetries: input.maxRetries ?? 0,
        events: {
          create: {
            eventType: 'CREATED',
            message: '任务已创建',
          },
        },
      },
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return this.serializeJob(job);
  }

  async listJobs(userId: number, options: ListAiJobsOptions = {}): Promise<AiJob[]> {
    const where: Prisma.ai_jobsWhereInput = {
      userId,
    };

    if (options.status) {
      where.status = options.status;
    }

    const jobs = await this.prisma.ai_jobs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 20,
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return jobs.map((job) => this.serializeJob(job));
  }

  async getJob(userId: number, jobId: number): Promise<AiJob> {
    const job = await this.prisma.ai_jobs.findFirstOrThrow({
      where: {
        id: jobId,
        userId,
      },
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return this.serializeJob(job);
  }

  async cancelJob(userId: number, jobId: number): Promise<AiJob> {
    const job = await this.prisma.ai_jobs.update({
      where: {
        id: jobId,
        userId,
        status: {
          in: CANCELLABLE_JOB_STATUSES,
        },
      },
      data: {
        status: AiJobStatus.CANCELED,
        finishedAt: new Date(),
        events: {
          create: {
            eventType: 'CANCELED',
            message: '任务已取消',
          },
        },
      },
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return this.serializeJob(job);
  }

  async retryJob(userId: number, jobId: number): Promise<AiJob> {
    const job = await this.prisma.ai_jobs.update({
      where: {
        id: jobId,
        userId,
        status: {
          in: RETRYABLE_JOB_STATUSES,
        },
      },
      data: {
        status: AiJobStatus.QUEUED,
        resultSummary: null,
        errorMessage: null,
        retryCount: 0,
        nextRetryAt: null,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        startedAt: null,
        finishedAt: null,
        events: {
          create: {
            eventType: 'RETRIED',
            message: '任务已重新入队',
          },
        },
      },
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return this.serializeJob(job);
  }

  async claimNextQueuedJob(workerId: string): Promise<AiJob | null> {
    const job = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<ClaimedJobIdRow[]>`
        SELECT id
        FROM ai_jobs
        WHERE status = 'QUEUED'
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      const row = rows[0];

      if (!row) {
        return null;
      }

      const now = new Date();

      return tx.ai_jobs.update({
        where: { id: row.id },
        data: {
          status: AiJobStatus.RUNNING,
          lockedAt: now,
          lockedBy: workerId,
          heartbeatAt: now,
          startedAt: now,
          events: {
            create: {
              eventType: 'STARTED',
              message: '任务开始执行',
            },
          },
        },
        include: {
          events: {
            orderBy: JOB_EVENTS_ORDER_BY,
          },
        },
      });
    });

    return job ? this.serializeJob(job) : null;
  }

  async completeJob(
    workerId: string,
    jobId: number,
    resultSummary: Prisma.InputJsonValue | null = null
  ): Promise<AiJob> {
    const job = await this.prisma.ai_jobs.update({
      where: {
        id: jobId,
        lockedBy: workerId,
        status: AiJobStatus.RUNNING,
      },
      data: {
        status: AiJobStatus.SUCCESS,
        resultSummary,
        errorMessage: null,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        finishedAt: new Date(),
        events: {
          create: {
            eventType: 'SUCCEEDED',
            message: '任务执行成功',
            payload: resultSummary,
          },
        },
      },
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return this.serializeJob(job);
  }

  async failJob(workerId: string, jobId: number, errorMessage: string): Promise<AiJob> {
    const job = await this.prisma.ai_jobs.findFirstOrThrow({
      where: {
        id: jobId,
        lockedBy: workerId,
        status: AiJobStatus.RUNNING,
      },
      select: {
        id: true,
        retryCount: true,
        maxRetries: true,
      },
    });
    const nextRetryCount = job.retryCount + 1;
    const canRetry = job.retryCount < job.maxRetries;

    if (canRetry) {
      const updated = await this.prisma.ai_jobs.update({
        where: { id: job.id },
        data: {
          status: AiJobStatus.QUEUED,
          retryCount: { increment: 1 },
          errorMessage,
          nextRetryAt: this.getNextRetryAt(nextRetryCount),
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          events: {
            create: {
              eventType: 'RETRY_SCHEDULED',
              message: '任务失败，已重新入队',
              payload: {
                errorMessage,
                retryCount: nextRetryCount,
              },
            },
          },
        },
        include: {
          events: {
            orderBy: JOB_EVENTS_ORDER_BY,
          },
        },
      });

      return this.serializeJob(updated);
    }

    const updated = await this.prisma.ai_jobs.update({
      where: { id: job.id },
      data: {
        status: AiJobStatus.FAILED,
        errorMessage,
        nextRetryAt: null,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        finishedAt: new Date(),
        events: {
          create: {
            eventType: 'FAILED',
            message: '任务执行失败',
            payload: {
              errorMessage,
            },
          },
        },
      },
      include: {
        events: {
          orderBy: JOB_EVENTS_ORDER_BY,
        },
      },
    });

    return this.serializeJob(updated);
  }

  private serializeJob(job: AiJobWithEvents): AiJob {
    return {
      id: job.id,
      userId: job.userId,
      projectId: job.projectId,
      outlineId: job.outlineId,
      manuscriptId: job.manuscriptId,
      chapterId: job.chapterId,
      taskType: job.taskType,
      status: job.status,
      priority: job.priority,
      provider: job.provider,
      model: job.model,
      presetId: job.presetId,
      presetVersion: job.presetVersion,
      inputPayload: job.inputPayload,
      contextMeta: job.contextMeta,
      resultSummary: job.resultSummary,
      errorMessage: job.errorMessage,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      nextRetryAt: this.serializeDate(job.nextRetryAt),
      lockedAt: this.serializeDate(job.lockedAt),
      lockedBy: job.lockedBy,
      heartbeatAt: this.serializeDate(job.heartbeatAt),
      startedAt: this.serializeDate(job.startedAt),
      finishedAt: this.serializeDate(job.finishedAt),
      createdAt: this.serializeDate(job.createdAt),
      updatedAt: this.serializeDate(job.updatedAt),
      events: job.events.map((event) => this.serializeEvent(event)),
    };
  }

  private serializeEvent(event: AiJobWithEvents['events'][number]): AiJobEvent {
    return {
      id: event.id,
      jobId: event.jobId,
      eventType: event.eventType,
      message: event.message,
      payload: event.payload,
      createdAt: this.serializeDate(event.createdAt),
    };
  }

  private serializeDate(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }

  private getNextRetryAt(retryCount: number): Date {
    const delayMs = Math.min(60_000, 1000 * 2 ** Math.max(0, retryCount - 1));
    return new Date(Date.now() + delayMs);
  }
}
