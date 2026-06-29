import { Injectable } from '@nestjs/common';
import type { AiJob } from '@moge/types';
import type { Prisma } from '../../generated/prisma';
import { ManuscriptsService } from '../manuscripts/manuscripts.service';
import { OutlineService } from '../outline/outline.service';
import type { AiJobProcessors } from './ai-jobs-worker.service';

@Injectable()
export class AppAiJobProcessorsService implements AiJobProcessors {
  constructor(
    private readonly outlineService: OutlineService,
    private readonly manuscriptsService: ManuscriptsService
  ) {}

  processOutlineGenerateJob(job: AiJob): Promise<Prisma.InputJsonObject> {
    return this.outlineService.processOutlineGenerateJob(job);
  }

  processChapterSummarizeJob(job: AiJob): Promise<Prisma.InputJsonObject> {
    return this.manuscriptsService.processChapterSummarizeJob(job);
  }
}
