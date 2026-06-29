import { ProjectsAuthenticatedRequest, ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';
import type { User } from '@moge/types';

interface MockProjectsService {
  getProjectAiConfig: jest.Mock;
  upsertProjectAiConfig: jest.Mock;
  listProjectMemoryItems: jest.Mock;
  createProjectMemoryItem: jest.Mock;
  updateProjectMemoryItem: jest.Mock;
  deleteProjectMemoryItem: jest.Mock;
  listProjectKnowledgeDocuments: jest.Mock;
  createProjectKnowledgeDocument: jest.Mock;
  updateProjectKnowledgeDocument: jest.Mock;
  deleteProjectKnowledgeDocument: jest.Mock;
  getProjectPromptPresets: jest.Mock;
  createProjectPromptPreset: jest.Mock;
  createUserPromptPreset: jest.Mock;
  updateUserPromptPreset: jest.Mock;
  appendUserPromptPresetVersion: jest.Mock;
  disableUserPromptPreset: jest.Mock;
  updateProjectPromptPreset: jest.Mock;
  appendProjectPromptPresetVersion: jest.Mock;
  cloneProjectPromptPreset: jest.Mock;
  disableProjectPromptPreset: jest.Mock;
}

const authRequest = {
  user: { id: '100', username: 'tester' } satisfies User,
} as unknown as ProjectsAuthenticatedRequest;

function createController() {
  const service: MockProjectsService = {
    getProjectAiConfig: jest.fn(),
    upsertProjectAiConfig: jest.fn(),
    listProjectMemoryItems: jest.fn(),
    createProjectMemoryItem: jest.fn(),
    updateProjectMemoryItem: jest.fn(),
    deleteProjectMemoryItem: jest.fn(),
    listProjectKnowledgeDocuments: jest.fn(),
    createProjectKnowledgeDocument: jest.fn(),
    updateProjectKnowledgeDocument: jest.fn(),
    deleteProjectKnowledgeDocument: jest.fn(),
    getProjectPromptPresets: jest.fn(),
    createProjectPromptPreset: jest.fn(),
    createUserPromptPreset: jest.fn(),
    updateUserPromptPreset: jest.fn(),
    appendUserPromptPresetVersion: jest.fn(),
    disableUserPromptPreset: jest.fn(),
    updateProjectPromptPreset: jest.fn(),
    appendProjectPromptPresetVersion: jest.fn(),
    cloneProjectPromptPreset: jest.fn(),
    disableProjectPromptPreset: jest.fn(),
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

  it('delegates project memory list reads to the service with current user', async () => {
    const { controller, service } = createController();
    service.listProjectMemoryItems.mockResolvedValue([
      {
        id: 701,
        projectId: 9,
        title: '叙事口吻',
      },
    ]);

    await expect(controller.listProjectMemoryItems(authRequest, 9)).resolves.toEqual([
      {
        id: 701,
        projectId: 9,
        title: '叙事口吻',
      },
    ]);
    expect(service.listProjectMemoryItems).toHaveBeenCalledWith(100, 9);
  });

  it('delegates project memory creation to the service with current user', async () => {
    const { controller, service } = createController();
    service.createProjectMemoryItem.mockResolvedValue({
      id: 702,
      projectId: 9,
      title: '称谓约束',
    });

    await expect(
      controller.createProjectMemoryItem(authRequest, 9, {
        category: 'CONSTRAINT',
        title: '称谓约束',
        content: '主角称呼师父为先生。',
        priority: 5,
      })
    ).resolves.toMatchObject({
      id: 702,
      title: '称谓约束',
    });
    expect(service.createProjectMemoryItem).toHaveBeenCalledWith(100, 9, {
      category: 'CONSTRAINT',
      title: '称谓约束',
      content: '主角称呼师父为先生。',
      priority: 5,
    });
  });

  it('delegates project memory updates to the service with current user', async () => {
    const { controller, service } = createController();
    service.updateProjectMemoryItem.mockResolvedValue({
      id: 702,
      projectId: 9,
      priority: 8,
    });

    await expect(
      controller.updateProjectMemoryItem(authRequest, 9, 702, {
        priority: 8,
      })
    ).resolves.toMatchObject({
      id: 702,
      priority: 8,
    });
    expect(service.updateProjectMemoryItem).toHaveBeenCalledWith(100, 9, 702, {
      priority: 8,
    });
  });

  it('delegates project memory deletion to the service with current user', async () => {
    const { controller, service } = createController();
    service.deleteProjectMemoryItem.mockResolvedValue({
      message: '项目记忆已删除',
    });

    await expect(controller.deleteProjectMemoryItem(authRequest, 9, 702)).resolves.toEqual({
      message: '项目记忆已删除',
    });
    expect(service.deleteProjectMemoryItem).toHaveBeenCalledWith(100, 9, 702);
  });

  it('delegates project knowledge document list reads to the service with current user', async () => {
    const { controller, service } = createController();
    service.listProjectKnowledgeDocuments.mockResolvedValue([
      {
        id: 801,
        projectId: 9,
        title: '门派制度',
      },
    ]);

    await expect(controller.listProjectKnowledgeDocuments(authRequest, 9)).resolves.toEqual([
      {
        id: 801,
        projectId: 9,
        title: '门派制度',
      },
    ]);
    expect(service.listProjectKnowledgeDocuments).toHaveBeenCalledWith(100, 9);
  });

  it('delegates project knowledge document creation to the service with current user', async () => {
    const { controller, service } = createController();
    service.createProjectKnowledgeDocument.mockResolvedValue({
      id: 802,
      projectId: 9,
      title: '人物关系',
    });

    await expect(
      controller.createProjectKnowledgeDocument(authRequest, 9, {
        title: '人物关系',
        documentType: 'NOTE',
        content: '主角与师父互相信任。',
      })
    ).resolves.toMatchObject({
      id: 802,
      title: '人物关系',
    });
    expect(service.createProjectKnowledgeDocument).toHaveBeenCalledWith(100, 9, {
      title: '人物关系',
      documentType: 'NOTE',
      content: '主角与师父互相信任。',
    });
  });

  it('delegates project knowledge document updates to the service with current user', async () => {
    const { controller, service } = createController();
    service.updateProjectKnowledgeDocument.mockResolvedValue({
      id: 802,
      projectId: 9,
      title: '人物关系',
    });

    await expect(
      controller.updateProjectKnowledgeDocument(authRequest, 9, 802, {
        title: '人物关系',
      })
    ).resolves.toMatchObject({
      id: 802,
      title: '人物关系',
    });
    expect(service.updateProjectKnowledgeDocument).toHaveBeenCalledWith(100, 9, 802, {
      title: '人物关系',
    });
  });

  it('delegates project knowledge document deletion to the service with current user', async () => {
    const { controller, service } = createController();
    service.deleteProjectKnowledgeDocument.mockResolvedValue({
      message: '项目资料已删除',
    });

    await expect(controller.deleteProjectKnowledgeDocument(authRequest, 9, 802)).resolves.toEqual({
      message: '项目资料已删除',
    });
    expect(service.deleteProjectKnowledgeDocument).toHaveBeenCalledWith(100, 9, 802);
  });

  it('delegates project prompt preset clone requests to the service with current user', async () => {
    const { controller, service } = createController();
    service.cloneProjectPromptPreset.mockResolvedValue({
      id: 502,
      projectId: 9,
      name: '系统续写 副本',
    });

    await expect(controller.cloneProjectPromptPreset(authRequest, 9, 301)).resolves.toMatchObject({
      id: 502,
      name: '系统续写 副本',
    });
    expect(service.cloneProjectPromptPreset).toHaveBeenCalledWith(100, 9, 301);
  });

  it('delegates user prompt preset creation to the service with current user', async () => {
    const { controller, service } = createController();
    service.createUserPromptPreset.mockResolvedValue({
      id: 503,
      projectId: null,
      scope: 'USER',
      name: '个人续写',
    });

    await expect(
      controller.createUserPromptPreset(authRequest, 9, {
        code: 'personal-continue',
        name: '个人续写',
        taskType: 'MANUSCRIPT_CONTINUE',
        systemPrompt: '保持一致叙事风格。',
        userPromptTemplate: '请续写：{{content}}',
        outputFormat: 'TEXT',
      })
    ).resolves.toMatchObject({
      id: 503,
      scope: 'USER',
      name: '个人续写',
    });
    expect(service.createUserPromptPreset).toHaveBeenCalledWith(100, 9, {
      code: 'personal-continue',
      name: '个人续写',
      taskType: 'MANUSCRIPT_CONTINUE',
      systemPrompt: '保持一致叙事风格。',
      userPromptTemplate: '请续写：{{content}}',
      outputFormat: 'TEXT',
    });
  });

  it('delegates project prompt preset metadata updates to the service with current user', async () => {
    const { controller, service } = createController();
    service.updateProjectPromptPreset.mockResolvedValue({
      id: 501,
      projectId: 9,
      name: '冷静续写',
    });

    await expect(
      controller.updateProjectPromptPreset(authRequest, 9, 501, {
        code: 'calm-continue',
        name: '冷静续写',
        description: '更克制的叙述节奏',
      })
    ).resolves.toMatchObject({
      id: 501,
      name: '冷静续写',
    });
    expect(service.updateProjectPromptPreset).toHaveBeenCalledWith(100, 9, 501, {
      code: 'calm-continue',
      name: '冷静续写',
      description: '更克制的叙述节奏',
    });
  });

  it('delegates user prompt preset metadata updates to the service with current user', async () => {
    const { controller, service } = createController();
    service.updateUserPromptPreset.mockResolvedValue({
      id: 503,
      scope: 'USER',
      name: '个人冷静续写',
    });

    await expect(
      controller.updateUserPromptPreset(authRequest, 9, 503, {
        code: 'personal-calm-continue',
        name: '个人冷静续写',
      })
    ).resolves.toMatchObject({
      id: 503,
      name: '个人冷静续写',
    });
    expect(service.updateUserPromptPreset).toHaveBeenCalledWith(100, 9, 503, {
      code: 'personal-calm-continue',
      name: '个人冷静续写',
    });
  });

  it('delegates user prompt preset version appends to the service with current user', async () => {
    const { controller, service } = createController();
    service.appendUserPromptPresetVersion.mockResolvedValue({
      id: 503,
      scope: 'USER',
      latestVersion: 2,
    });

    await expect(
      controller.appendUserPromptPresetVersion(authRequest, 9, 503, {
        systemPrompt: '新版系统提示词',
        userPromptTemplate: '新版用户模板',
        outputFormat: 'TEXT',
      })
    ).resolves.toMatchObject({
      id: 503,
      latestVersion: 2,
    });
    expect(service.appendUserPromptPresetVersion).toHaveBeenCalledWith(100, 9, 503, {
      systemPrompt: '新版系统提示词',
      userPromptTemplate: '新版用户模板',
      outputFormat: 'TEXT',
    });
  });

  it('delegates user prompt preset disable requests to the service with current user', async () => {
    const { controller, service } = createController();
    service.disableUserPromptPreset.mockResolvedValue({
      id: 503,
      scope: 'USER',
      isEnabled: false,
    });

    await expect(controller.disableUserPromptPreset(authRequest, 9, 503)).resolves.toMatchObject({
      id: 503,
      isEnabled: false,
    });
    expect(service.disableUserPromptPreset).toHaveBeenCalledWith(100, 9, 503);
  });
});
