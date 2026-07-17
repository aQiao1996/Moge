import { AiTaskType } from '../../generated/prisma';
import { AiJobsWorkerService } from './ai-jobs-worker.service';
import type { AiJobsService } from './ai-jobs.service';

interface MockAiJobsService {
  recoverStaleJobs: jest.Mock;
  claimNextQueuedJob: jest.Mock;
  touchHeartbeat: jest.Mock;
  completeJob: jest.Mock;
  failJob: jest.Mock;
}

interface MockAiJobProcessors {
  processOutlineGenerateJob: jest.Mock;
  processChapterSummarizeJob: jest.Mock;
}

function createWorker(service: MockAiJobsService, processors?: MockAiJobProcessors) {
  return new AiJobsWorkerService(service as unknown as AiJobsService, processors);
}

describe('AiJobsWorkerService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does nothing when no queued job can be claimed', async () => {
    const service: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn().mockResolvedValue(null),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const worker = createWorker(service);

    await worker.processNextJob();

    expect(service.recoverStaleJobs).toHaveBeenCalledWith(expect.any(Date));
    expect(service.recoverStaleJobs.mock.invocationCallOrder[0]).toBeLessThan(
      service.claimNextQueuedJob.mock.invocationCallOrder[0]
    );
    expect(service.claimNextQueuedJob).toHaveBeenCalledTimes(1);
    expect(service.completeJob).not.toHaveBeenCalled();
    expect(service.failJob).not.toHaveBeenCalled();
  });

  it('uses a unique worker identity for each application instance', async () => {
    let firstWorkerId: string | undefined;
    let secondWorkerId: string | undefined;
    const firstService: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn((workerId: string) => {
        firstWorkerId = workerId;
        return Promise.resolve(null);
      }),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const secondService: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn((workerId: string) => {
        secondWorkerId = workerId;
        return Promise.resolve(null);
      }),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };

    await Promise.all([
      createWorker(firstService).processNextJob(),
      createWorker(secondService).processNextJob(),
    ]);

    expect(firstWorkerId).toBeDefined();
    expect(secondWorkerId).toBeDefined();
    expect(firstWorkerId).not.toBe(secondWorkerId);
  });

  it('fails unsupported jobs so retry policy can handle them', async () => {
    const service: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 704,
        taskType: AiTaskType.MANUSCRIPT_CONTINUE,
      }),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const worker = createWorker(service);

    await worker.processNextJob();

    expect(service.failJob).toHaveBeenCalledWith(
      expect.stringMatching(/^moge-ai-worker-/),
      704,
      '暂不支持的 AI 任务类型：MANUSCRIPT_CONTINUE'
    );
    expect(service.completeJob).not.toHaveBeenCalled();
  });

  it('dispatches outline generation jobs to the outline processor and completes them', async () => {
    const service: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 705,
        taskType: AiTaskType.OUTLINE_GENERATE,
        outlineId: 11,
      }),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const processors: MockAiJobProcessors = {
      processOutlineGenerateJob: jest.fn().mockResolvedValue({
        outlineId: 11,
        contentLength: 3000,
      }),
      processChapterSummarizeJob: jest.fn(),
    };
    const worker = createWorker(service, processors);

    await worker.processNextJob();

    expect(processors.processOutlineGenerateJob).toHaveBeenCalledWith({
      id: 705,
      taskType: AiTaskType.OUTLINE_GENERATE,
      outlineId: 11,
    });
    expect(service.completeJob).toHaveBeenCalledWith(
      expect.stringMatching(/^moge-ai-worker-/),
      705,
      {
        outlineId: 11,
        contentLength: 3000,
      }
    );
    expect(service.failJob).not.toHaveBeenCalled();
  });

  it('dispatches chapter summary jobs to the manuscript processor and completes them', async () => {
    const service: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 706,
        taskType: AiTaskType.CHAPTER_SUMMARIZE,
        chapterId: 18,
        userId: 100,
      }),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const processors: MockAiJobProcessors = {
      processOutlineGenerateJob: jest.fn(),
      processChapterSummarizeJob: jest.fn().mockResolvedValue({
        chapterId: 18,
        summaryLength: 24,
      }),
    };
    const worker = createWorker(service, processors);

    await worker.processNextJob();

    expect(processors.processChapterSummarizeJob).toHaveBeenCalledWith({
      id: 706,
      taskType: AiTaskType.CHAPTER_SUMMARIZE,
      chapterId: 18,
      userId: 100,
    });
    expect(service.completeJob).toHaveBeenCalledWith(
      expect.stringMatching(/^moge-ai-worker-/),
      706,
      {
        chapterId: 18,
        summaryLength: 24,
      }
    );
    expect(service.failJob).not.toHaveBeenCalled();
  });

  it('fails a claimed job when its processor throws', async () => {
    const service: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 707,
        taskType: AiTaskType.OUTLINE_GENERATE,
      }),
      touchHeartbeat: jest.fn(),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const processors: MockAiJobProcessors = {
      processOutlineGenerateJob: jest.fn().mockRejectedValue(new Error('模型超时')),
      processChapterSummarizeJob: jest.fn(),
    };
    const worker = createWorker(service, processors);

    await worker.processNextJob();

    expect(service.failJob).toHaveBeenCalledWith(
      expect.stringMatching(/^moge-ai-worker-/),
      707,
      '模型超时'
    );
    expect(service.completeJob).not.toHaveBeenCalled();
  });

  it('refreshes the heartbeat while a claimed job is still running', async () => {
    jest.useFakeTimers();
    let finishProcessing: ((value: { outlineId: number }) => void) | undefined;
    const processing = new Promise<{ outlineId: number }>((resolve) => {
      finishProcessing = resolve;
    });
    const service: MockAiJobsService = {
      recoverStaleJobs: jest.fn().mockResolvedValue(0),
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 708,
        taskType: AiTaskType.OUTLINE_GENERATE,
      }),
      touchHeartbeat: jest.fn().mockResolvedValue(undefined),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const processors: MockAiJobProcessors = {
      processOutlineGenerateJob: jest.fn().mockReturnValue(processing),
      processChapterSummarizeJob: jest.fn(),
    };
    const worker = createWorker(service, processors);

    const workerRun = worker.processNextJob();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(service.touchHeartbeat).toHaveBeenCalledWith(
      expect.stringMatching(/^moge-ai-worker-/),
      708
    );

    finishProcessing?.({ outlineId: 12 });
    await workerRun;
  });
});
