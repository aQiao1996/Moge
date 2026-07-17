import { Inject, Injectable, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import type { AiJob } from '@moge/types';
import { AiTaskType } from '../../generated/prisma';
import type { Prisma } from '../../generated/prisma';
import { AiJobsService } from './ai-jobs.service';

const WORKER_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 30_000;
const STALE_JOB_TIMEOUT_MS = 5 * 60_000;

export interface AiJobProcessors {
  processOutlineGenerateJob(job: AiJob): Promise<Prisma.InputJsonObject>;
  processChapterSummarizeJob(job: AiJob): Promise<Prisma.InputJsonObject>;
}

export const AI_JOB_PROCESSORS = Symbol('AI_JOB_PROCESSORS');

@Injectable()
export class AiJobsWorkerService {
  private readonly workerId = `moge-ai-worker-${process.pid}-${randomUUID()}`;
  private running = false;

  constructor(
    private readonly aiJobsService: AiJobsService,
    @Optional()
    @Inject(AI_JOB_PROCESSORS)
    private readonly processors?: AiJobProcessors
  ) {}

  @Interval(WORKER_INTERVAL_MS)
  async processNextJob(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      await this.aiJobsService.recoverStaleJobs(new Date(Date.now() - STALE_JOB_TIMEOUT_MS));
      const job = await this.aiJobsService.claimNextQueuedJob(this.workerId);

      if (!job) {
        return;
      }

      const jobId = job.id;
      const heartbeatTimer = jobId
        ? setInterval(() => {
            void this.aiJobsService.touchHeartbeat(this.workerId, jobId).catch((error: unknown) => {
              console.error('AI 任务 Worker 心跳更新失败:', error);
            });
          }, HEARTBEAT_INTERVAL_MS)
        : undefined;

      try {
        await this.dispatchJob(job);
      } catch (error) {
        if (!job.id) {
          throw error;
        }

        await this.aiJobsService.failJob(this.workerId, job.id, this.getErrorMessage(error));
      } finally {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
      }
    } catch (error) {
      console.error('AI 任务 Worker 执行失败:', error);
    } finally {
      this.running = false;
    }
  }

  private async dispatchJob(job: AiJob): Promise<void> {
    if (!job.id) {
      return;
    }

    if (job.taskType === AiTaskType.OUTLINE_GENERATE && this.processors) {
      const result = await this.processors.processOutlineGenerateJob(job);
      await this.aiJobsService.completeJob(this.workerId, job.id, result);
      return;
    }

    if (job.taskType === AiTaskType.CHAPTER_SUMMARIZE && this.processors) {
      const result = await this.processors.processChapterSummarizeJob(job);
      await this.aiJobsService.completeJob(this.workerId, job.id, result);
      return;
    }

    await this.aiJobsService.failJob(
      this.workerId,
      job.id,
      `暂不支持的 AI 任务类型：${job.taskType ?? 'UNKNOWN'}`
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string' && error) {
      return error;
    }

    return 'AI 任务执行失败';
  }
}
