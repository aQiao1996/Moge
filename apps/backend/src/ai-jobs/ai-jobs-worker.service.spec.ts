import { AiTaskType } from '../../generated/prisma';
import { AiJobsWorkerService } from './ai-jobs-worker.service';
import type { AiJobsService } from './ai-jobs.service';

interface MockAiJobsService {
  claimNextQueuedJob: jest.Mock;
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
    jest.restoreAllMocks();
  });

  it('does nothing when no queued job can be claimed', async () => {
    const service: MockAiJobsService = {
      claimNextQueuedJob: jest.fn().mockResolvedValue(null),
      completeJob: jest.fn(),
      failJob: jest.fn(),
    };
    const worker = createWorker(service);

    await worker.processNextJob();

    expect(service.claimNextQueuedJob).toHaveBeenCalledTimes(1);
    expect(service.completeJob).not.toHaveBeenCalled();
    expect(service.failJob).not.toHaveBeenCalled();
  });

  it('fails unsupported jobs so retry policy can handle them', async () => {
    const service: MockAiJobsService = {
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 704,
        taskType: AiTaskType.MANUSCRIPT_CONTINUE,
      }),
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
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 705,
        taskType: AiTaskType.OUTLINE_GENERATE,
        outlineId: 11,
      }),
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
      claimNextQueuedJob: jest.fn().mockResolvedValue({
        id: 706,
        taskType: AiTaskType.CHAPTER_SUMMARIZE,
        chapterId: 18,
        userId: 100,
      }),
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
});
