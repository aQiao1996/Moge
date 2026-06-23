import { ProjectsAuthenticatedRequest, ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';
import type { User } from '@moge/types';

interface MockProjectsService {
  getProjectAiConfig: jest.Mock;
  upsertProjectAiConfig: jest.Mock;
}

const authRequest = {
  user: { id: '100', username: 'tester' } satisfies User,
} as unknown as ProjectsAuthenticatedRequest;

function createController() {
  const service: MockProjectsService = {
    getProjectAiConfig: jest.fn(),
    upsertProjectAiConfig: jest.fn(),
  };

  return {
    controller: new ProjectsController(service as unknown as ProjectsService),
    service,
  };
}

describe('ProjectsController AI config', () => {
  it('delegates project AI config reads to the service with current user', async () => {
    const { controller, service } = createController();
    service.getProjectAiConfig.mockResolvedValue({
      projectId: 9,
      provider: 'openai_compatible',
      model: 'gpt-5.2',
    });

    await expect(controller.getProjectAiConfig(authRequest, 9)).resolves.toMatchObject({
      projectId: 9,
      provider: 'openai_compatible',
      model: 'gpt-5.2',
    });
    expect(service.getProjectAiConfig).toHaveBeenCalledWith(100, 9);
  });

  it('delegates project AI config updates to the service with current user', async () => {
    const { controller, service } = createController();
    service.upsertProjectAiConfig.mockResolvedValue({
      projectId: 9,
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
    });

    await expect(
      controller.updateProjectAiConfig(authRequest, 9, {
        provider: 'moonshot',
        model: 'moonshot-v1-8k',
      })
    ).resolves.toMatchObject({
      projectId: 9,
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
    });
    expect(service.upsertProjectAiConfig).toHaveBeenCalledWith(100, 9, {
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
    });
  });
});
