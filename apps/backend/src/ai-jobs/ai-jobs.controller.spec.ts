import { AiJobStatus } from '../../generated/prisma';
import { AiJobsController, type AiJobsAuthenticatedRequest } from './ai-jobs.controller';
import type { AiJobsService } from './ai-jobs.service';

interface MockAiJobsService {
  listJobs: jest.Mock;
  getJob: jest.Mock;
  cancelJob: jest.Mock;
  retryJob: jest.Mock;
}

const authRequest = {
  user: { id: 100 },
} as AiJobsAuthenticatedRequest;

function createController() {
  const service: MockAiJobsService = {
    listJobs: jest.fn(),
    getJob: jest.fn(),
    cancelJob: jest.fn(),
    retryJob: jest.fn(),
  };

  return {
    controller: new AiJobsController(service as unknown as AiJobsService),
    service,
  };
}

describe('AiJobsController', () => {
  it('lists AI jobs for the current user with parsed query options', async () => {
    const { controller, service } = createController();
    service.listJobs.mockResolvedValue([
      {
        id: 701,
        userId: 100,
        status: AiJobStatus.RUNNING,
      },
    ]);

    await expect(
      controller.listJobs(authRequest, {
        status: AiJobStatus.RUNNING,
        limit: '5',
      })
    ).resolves.toEqual([
      {
        id: 701,
        userId: 100,
        status: AiJobStatus.RUNNING,
      },
    ]);
    expect(service.listJobs).toHaveBeenCalledWith(100, {
      status: AiJobStatus.RUNNING,
      limit: 5,
    });
  });

  it('cancels an AI job for the current user', async () => {
    const { controller, service } = createController();
    service.cancelJob.mockResolvedValue({
      id: 703,
      userId: 100,
      status: AiJobStatus.CANCELED,
    });

    await expect(controller.cancelJob(authRequest, 703)).resolves.toEqual({
      id: 703,
      userId: 100,
      status: AiJobStatus.CANCELED,
    });
    expect(service.cancelJob).toHaveBeenCalledWith(100, 703);
  });

  it('gets an AI job for the current user', async () => {
    const { controller, service } = createController();
    service.getJob.mockResolvedValue({
      id: 708,
      userId: 100,
      status: AiJobStatus.RUNNING,
    });

    await expect(controller.getJob(authRequest, 708)).resolves.toEqual({
      id: 708,
      userId: 100,
      status: AiJobStatus.RUNNING,
    });
    expect(service.getJob).toHaveBeenCalledWith(100, 708);
  });

  it('retries an AI job for the current user', async () => {
    const { controller, service } = createController();
    service.retryJob.mockResolvedValue({
      id: 709,
      userId: 100,
      status: AiJobStatus.QUEUED,
    });

    await expect(controller.retryJob(authRequest, 709)).resolves.toEqual({
      id: 709,
      userId: 100,
      status: AiJobStatus.QUEUED,
    });
    expect(service.retryJob).toHaveBeenCalledWith(100, 709);
  });
});
