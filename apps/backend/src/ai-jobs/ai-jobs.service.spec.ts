import { AiJobStatus, AiTaskType } from '../../generated/prisma';
import type { PrismaService } from '../prisma/prisma.service';
import { AiJobsService } from './ai-jobs.service';

describe('AiJobsService', () => {
  function createService(prisma: unknown) {
    return new AiJobsService(prisma as PrismaService);
  }

  it('creates a queued AI job and records a created event', async () => {
    const createdAt = new Date('2026-06-26T02:00:00.000Z');
    const prisma = {
      ai_jobs: {
        create: jest.fn().mockResolvedValue({
          id: 701,
          userId: 100,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          taskType: AiTaskType.MANUSCRIPT_CONTINUE,
          status: AiJobStatus.QUEUED,
          priority: 10,
          provider: 'moonshot',
          model: 'moonshot-v1-32k',
          presetId: 301,
          presetVersion: 2,
          inputPayload: { customPrompt: '继续冲突' },
          contextMeta: { sourceCount: 3 },
          resultSummary: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 2,
          nextRetryAt: null,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          startedAt: null,
          finishedAt: null,
          createdAt,
          updatedAt: createdAt,
          events: [
            {
              id: 801,
              jobId: 701,
              eventType: 'CREATED',
              message: '任务已创建',
              payload: null,
              createdAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.createJob(100, {
      projectId: 9,
      manuscriptId: 3,
      chapterId: 7,
      taskType: AiTaskType.MANUSCRIPT_CONTINUE,
      priority: 10,
      provider: 'moonshot',
      model: 'moonshot-v1-32k',
      presetId: 301,
      presetVersion: 2,
      inputPayload: { customPrompt: '继续冲突' },
      contextMeta: { sourceCount: 3 },
      maxRetries: 2,
    });

    expect(prisma.ai_jobs.create).toHaveBeenCalledWith({
      data: {
        userId: 100,
        projectId: 9,
        outlineId: null,
        manuscriptId: 3,
        chapterId: 7,
        taskType: AiTaskType.MANUSCRIPT_CONTINUE,
        status: AiJobStatus.QUEUED,
        priority: 10,
        provider: 'moonshot',
        model: 'moonshot-v1-32k',
        presetId: 301,
        presetVersion: 2,
        inputPayload: { customPrompt: '继续冲突' },
        contextMeta: { sourceCount: 3 },
        maxRetries: 2,
        events: {
          create: {
            eventType: 'CREATED',
            message: '任务已创建',
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 701,
      userId: 100,
      taskType: 'MANUSCRIPT_CONTINUE',
      status: 'QUEUED',
      events: [
        {
          eventType: 'CREATED',
          message: '任务已创建',
        },
      ],
    });
    expect(job.createdAt).toBe('2026-06-26T02:00:00.000Z');
  });

  it('lists recent AI jobs for the current user', async () => {
    const createdAt = new Date('2026-06-26T03:00:00.000Z');
    const prisma = {
      ai_jobs: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 702,
            userId: 100,
            projectId: 9,
            outlineId: null,
            manuscriptId: null,
            chapterId: null,
            taskType: AiTaskType.MANUSCRIPT_POLISH,
            status: AiJobStatus.RUNNING,
            priority: 0,
            provider: null,
            model: null,
            presetId: null,
            presetVersion: null,
            inputPayload: null,
            contextMeta: null,
            resultSummary: null,
            errorMessage: null,
            retryCount: 0,
            maxRetries: 0,
            nextRetryAt: null,
            lockedAt: null,
            lockedBy: null,
            heartbeatAt: null,
            startedAt: null,
            finishedAt: null,
            createdAt,
            updatedAt: createdAt,
            events: [],
          },
        ]),
      },
    };
    const service = createService(prisma);

    const jobs = await service.listJobs(100, { limit: 5 });

    expect(prisma.ai_jobs.findMany).toHaveBeenCalledWith({
      where: { userId: 100 },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: 702,
      status: 'RUNNING',
      taskType: 'MANUSCRIPT_POLISH',
    });
  });

  it('gets one AI job for the current user with ordered events', async () => {
    const createdAt = new Date('2026-06-26T03:20:00.000Z');
    const startedAt = new Date('2026-06-26T03:21:00.000Z');
    const prisma = {
      ai_jobs: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 708,
          userId: 100,
          projectId: null,
          outlineId: 12,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.OUTLINE_GENERATE,
          status: AiJobStatus.RUNNING,
          priority: 0,
          provider: 'moonshot',
          model: 'moonshot-v1-32k',
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: { outlineId: 12 },
          resultSummary: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 0,
          nextRetryAt: null,
          lockedAt: startedAt,
          lockedBy: 'worker-a',
          heartbeatAt: startedAt,
          startedAt,
          finishedAt: null,
          createdAt,
          updatedAt: startedAt,
          events: [
            {
              id: 807,
              jobId: 708,
              eventType: 'CREATED',
              message: '任务已创建',
              payload: null,
              createdAt,
            },
            {
              id: 808,
              jobId: 708,
              eventType: 'STARTED',
              message: '任务开始执行',
              payload: null,
              createdAt: startedAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.getJob(100, 708);

    expect(prisma.ai_jobs.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: 708,
        userId: 100,
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 708,
      userId: 100,
      outlineId: 12,
      taskType: 'OUTLINE_GENERATE',
      status: 'RUNNING',
      events: [
        {
          eventType: 'CREATED',
          message: '任务已创建',
        },
        {
          eventType: 'STARTED',
          message: '任务开始执行',
        },
      ],
    });
    expect(job.startedAt).toBe('2026-06-26T03:21:00.000Z');
  });

  it('cancels a cancellable AI job and records a canceled event', async () => {
    const createdAt = new Date('2026-06-26T04:00:00.000Z');
    const finishedAt = new Date('2026-06-26T04:01:00.000Z');
    const prisma = {
      ai_jobs: {
        update: jest.fn().mockResolvedValue({
          id: 703,
          userId: 100,
          projectId: 9,
          outlineId: null,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.MANUSCRIPT_EXPAND,
          status: AiJobStatus.CANCELED,
          priority: 0,
          provider: null,
          model: null,
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: null,
          resultSummary: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 0,
          nextRetryAt: null,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          startedAt: null,
          finishedAt,
          createdAt,
          updatedAt: finishedAt,
          events: [
            {
              id: 802,
              jobId: 703,
              eventType: 'CANCELED',
              message: '任务已取消',
              payload: null,
              createdAt: finishedAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.cancelJob(100, 703);

    expect(prisma.ai_jobs.update).toHaveBeenCalledWith({
      where: {
        id: 703,
        userId: 100,
        status: {
          in: [AiJobStatus.PENDING, AiJobStatus.QUEUED, AiJobStatus.RUNNING],
        },
      },
      data: {
        status: AiJobStatus.CANCELED,
        finishedAt: expect.any(Date) as Date,
        events: {
          create: {
            eventType: 'CANCELED',
            message: '任务已取消',
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 703,
      status: 'CANCELED',
      events: [
        {
          eventType: 'CANCELED',
          message: '任务已取消',
        },
      ],
    });
  });

  it('retries a terminal AI job by requeueing it and clearing failure fields', async () => {
    const createdAt = new Date('2026-06-26T04:20:00.000Z');
    const retriedAt = new Date('2026-06-26T04:25:00.000Z');
    const prisma = {
      ai_jobs: {
        update: jest.fn().mockResolvedValue({
          id: 709,
          userId: 100,
          projectId: null,
          outlineId: 12,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.OUTLINE_GENERATE,
          status: AiJobStatus.QUEUED,
          priority: 0,
          provider: null,
          model: null,
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: null,
          resultSummary: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 2,
          nextRetryAt: null,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          startedAt: null,
          finishedAt: null,
          createdAt,
          updatedAt: retriedAt,
          events: [
            {
              id: 809,
              jobId: 709,
              eventType: 'RETRIED',
              message: '任务已重新入队',
              payload: null,
              createdAt: retriedAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.retryJob(100, 709);

    expect(prisma.ai_jobs.update).toHaveBeenCalledWith({
      where: {
        id: 709,
        userId: 100,
        status: {
          in: [AiJobStatus.FAILED, AiJobStatus.CANCELED],
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 709,
      status: 'QUEUED',
      retryCount: 0,
      errorMessage: null,
      events: [
        {
          eventType: 'RETRIED',
          message: '任务已重新入队',
        },
      ],
    });
  });

  it('claims the next queued job for a worker and marks it running', async () => {
    const createdAt = new Date('2026-06-26T05:00:00.000Z');
    const startedAt = new Date('2026-06-26T05:01:00.000Z');
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 704 }]),
      ai_jobs: {
        update: jest.fn().mockResolvedValue({
          id: 704,
          userId: 100,
          projectId: 9,
          outlineId: null,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.MANUSCRIPT_CONTINUE,
          status: AiJobStatus.RUNNING,
          priority: 5,
          provider: null,
          model: null,
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: null,
          resultSummary: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 2,
          nextRetryAt: null,
          lockedAt: startedAt,
          lockedBy: 'worker-a',
          heartbeatAt: startedAt,
          startedAt,
          finishedAt: null,
          createdAt,
          updatedAt: startedAt,
          events: [
            {
              id: 803,
              jobId: 704,
              eventType: 'STARTED',
              message: '任务开始执行',
              payload: null,
              createdAt: startedAt,
            },
          ],
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    };
    const service = createService(prisma);

    const job = await service.claimNextQueuedJob('worker-a');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.ai_jobs.update).toHaveBeenCalledWith({
      where: { id: 704 },
      data: {
        status: AiJobStatus.RUNNING,
        lockedAt: expect.any(Date) as Date,
        lockedBy: 'worker-a',
        heartbeatAt: expect.any(Date) as Date,
        startedAt: expect.any(Date) as Date,
        events: {
          create: {
            eventType: 'STARTED',
            message: '任务开始执行',
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 704,
      status: 'RUNNING',
      lockedBy: 'worker-a',
      events: [
        {
          eventType: 'STARTED',
          message: '任务开始执行',
        },
      ],
    });
  });

  it('marks a running job as successful and clears worker lock fields', async () => {
    const createdAt = new Date('2026-06-26T06:00:00.000Z');
    const finishedAt = new Date('2026-06-26T06:03:00.000Z');
    const prisma = {
      ai_jobs: {
        update: jest.fn().mockResolvedValue({
          id: 705,
          userId: 100,
          projectId: 9,
          outlineId: null,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.MANUSCRIPT_POLISH,
          status: AiJobStatus.SUCCESS,
          priority: 0,
          provider: null,
          model: null,
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: null,
          resultSummary: { candidateCount: 1 },
          errorMessage: null,
          retryCount: 0,
          maxRetries: 0,
          nextRetryAt: null,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          startedAt: createdAt,
          finishedAt,
          createdAt,
          updatedAt: finishedAt,
          events: [
            {
              id: 804,
              jobId: 705,
              eventType: 'SUCCEEDED',
              message: '任务执行成功',
              payload: { candidateCount: 1 },
              createdAt: finishedAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.completeJob('worker-a', 705, { candidateCount: 1 });

    expect(prisma.ai_jobs.update).toHaveBeenCalledWith({
      where: {
        id: 705,
        lockedBy: 'worker-a',
        status: AiJobStatus.RUNNING,
      },
      data: {
        status: AiJobStatus.SUCCESS,
        resultSummary: { candidateCount: 1 },
        errorMessage: null,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        finishedAt: expect.any(Date) as Date,
        events: {
          create: {
            eventType: 'SUCCEEDED',
            message: '任务执行成功',
            payload: { candidateCount: 1 },
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 705,
      status: 'SUCCESS',
      resultSummary: { candidateCount: 1 },
    });
  });

  it('requeues a failed running job when retries remain', async () => {
    const createdAt = new Date('2026-06-26T07:00:00.000Z');
    const failedAt = new Date('2026-06-26T07:02:00.000Z');
    const prisma = {
      ai_jobs: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 706,
          retryCount: 0,
          maxRetries: 2,
        }),
        update: jest.fn().mockResolvedValue({
          id: 706,
          userId: 100,
          projectId: 9,
          outlineId: null,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.MANUSCRIPT_EXPAND,
          status: AiJobStatus.QUEUED,
          priority: 0,
          provider: null,
          model: null,
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: null,
          resultSummary: null,
          errorMessage: '模型超时',
          retryCount: 1,
          maxRetries: 2,
          nextRetryAt: failedAt,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          startedAt: createdAt,
          finishedAt: null,
          createdAt,
          updatedAt: failedAt,
          events: [
            {
              id: 805,
              jobId: 706,
              eventType: 'RETRY_SCHEDULED',
              message: '任务失败，已重新入队',
              payload: { errorMessage: '模型超时', retryCount: 1 },
              createdAt: failedAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.failJob('worker-a', 706, '模型超时');

    expect(prisma.ai_jobs.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: 706,
        lockedBy: 'worker-a',
        status: AiJobStatus.RUNNING,
      },
      select: {
        id: true,
        retryCount: true,
        maxRetries: true,
      },
    });
    expect(prisma.ai_jobs.update).toHaveBeenCalledWith({
      where: { id: 706 },
      data: {
        status: AiJobStatus.QUEUED,
        retryCount: { increment: 1 },
        errorMessage: '模型超时',
        nextRetryAt: expect.any(Date) as Date,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        events: {
          create: {
            eventType: 'RETRY_SCHEDULED',
            message: '任务失败，已重新入队',
            payload: {
              errorMessage: '模型超时',
              retryCount: 1,
            },
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 706,
      status: 'QUEUED',
      retryCount: 1,
    });
  });

  it('marks a failed running job as final failed when retries are exhausted', async () => {
    const createdAt = new Date('2026-06-26T08:00:00.000Z');
    const finishedAt = new Date('2026-06-26T08:04:00.000Z');
    const prisma = {
      ai_jobs: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 707,
          retryCount: 2,
          maxRetries: 2,
        }),
        update: jest.fn().mockResolvedValue({
          id: 707,
          userId: 100,
          projectId: 9,
          outlineId: null,
          manuscriptId: null,
          chapterId: null,
          taskType: AiTaskType.MANUSCRIPT_EXPAND,
          status: AiJobStatus.FAILED,
          priority: 0,
          provider: null,
          model: null,
          presetId: null,
          presetVersion: null,
          inputPayload: null,
          contextMeta: null,
          resultSummary: null,
          errorMessage: '连续失败',
          retryCount: 2,
          maxRetries: 2,
          nextRetryAt: null,
          lockedAt: null,
          lockedBy: null,
          heartbeatAt: null,
          startedAt: createdAt,
          finishedAt,
          createdAt,
          updatedAt: finishedAt,
          events: [
            {
              id: 806,
              jobId: 707,
              eventType: 'FAILED',
              message: '任务执行失败',
              payload: { errorMessage: '连续失败' },
              createdAt: finishedAt,
            },
          ],
        }),
      },
    };
    const service = createService(prisma);

    const job = await service.failJob('worker-a', 707, '连续失败');

    expect(prisma.ai_jobs.update).toHaveBeenCalledWith({
      where: { id: 707 },
      data: {
        status: AiJobStatus.FAILED,
        errorMessage: '连续失败',
        nextRetryAt: null,
        lockedAt: null,
        lockedBy: null,
        heartbeatAt: null,
        finishedAt: expect.any(Date) as Date,
        events: {
          create: {
            eventType: 'FAILED',
            message: '任务执行失败',
            payload: {
              errorMessage: '连续失败',
            },
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    expect(job).toMatchObject({
      id: 707,
      status: 'FAILED',
      errorMessage: '连续失败',
    });
  });
});
