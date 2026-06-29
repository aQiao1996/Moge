import { Inject, Injectable, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import type { AiJob } from '@moge/types';
import { AiTaskType } from '../../generated/prisma';
import type { Prisma } from '../../generated/prisma';
import { AiJobsService } from './ai-jobs.service';

const WORKER_INTERVAL_MS = 5000;

export interface AiJobProcessors {
  processOutlineGenerateJob(job: AiJob): Promise<Prisma.InputJsonObject>;
  processChapterSummarizeJob(job: AiJob): Promise<Prisma.InputJsonObject>;
}

export const AI_JOB_PROCESSORS = Symbol('AI_JOB_PROCESSORS');

@Injectable()
export class AiJobsWorkerService {
  private readonly workerId = `moge-ai-worker-${process.pid}`;
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
      const job = await this.aiJobsService.claimNextQueuedJob(this.workerId);

      if (!job) {
        return;
      }

      await this.dispatchJob(job);
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
}
