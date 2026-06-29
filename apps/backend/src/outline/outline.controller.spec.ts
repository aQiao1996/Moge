import { AiTaskType } from '../../generated/prisma';
import { OutlineController } from './outline.controller';
import type { OutlineService } from './outline.service';

interface MockOutlineService {
  createOutlineGenerateJob: jest.Mock;
}

const authRequest = {
  user: { id: '100' },
} as Parameters<OutlineController['createGenerateJob']>[1];

function createController() {
  const service: MockOutlineService = {
    createOutlineGenerateJob: jest.fn(),
  };

  return {
    controller: new OutlineController(service as unknown as OutlineService),
    service,
  };
}

describe('OutlineController AI jobs', () => {
  it('creates an outline generation job for the current user', async () => {
    const { controller, service } = createController();
    service.createOutlineGenerateJob.mockResolvedValue({
      id: 801,
      outlineId: 11,
      taskType: AiTaskType.OUTLINE_GENERATE,
      status: 'QUEUED',
    });

    await expect(controller.createGenerateJob(11, authRequest)).resolves.toMatchObject({
      id: 801,
      outlineId: 11,
      taskType: 'OUTLINE_GENERATE',
      status: 'QUEUED',
    });
    expect(service.createOutlineGenerateJob).toHaveBeenCalledWith(11, '100');
  });
});
