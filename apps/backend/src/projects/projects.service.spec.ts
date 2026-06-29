import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import type { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

interface MockPrismaService {
  projects: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
  project_members: {
    findUnique: jest.Mock;
  };
  project_ai_configs: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    updateMany: jest.Mock;
  };
  ai_prompt_presets: {
    count: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  ai_prompt_preset_versions: {
    create: jest.Mock;
  };
  project_memory_items: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  knowledge_documents: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  knowledge_chunks: {
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

interface ProjectAiConfigUpsertArgs {
  where: { projectId: number };
  create: { projectId: number };
  update: Record<string, unknown>;
}

function createBasePrisma(): MockPrismaService {
  const prisma = {
    projects: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    project_members: {
      findUnique: jest.fn(),
    },
    project_ai_configs: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    ai_prompt_presets: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    ai_prompt_preset_versions: {
      create: jest.fn(),
    },
    project_memory_items: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    knowledge_documents: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    knowledge_chunks: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: MockPrismaService) => Promise<unknown>) =>
      callback(createBasePrisma())
    ),
  } satisfies MockPrismaService;

  return prisma;
}

function createService(prisma: MockPrismaService): ProjectsService {
  return new ProjectsService(prisma as unknown as PrismaService);
}

describe('ProjectsService AI config', () => {
  const userId = 100;
  const projectId = 9;

  it('returns default AI config when the project has no saved config', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.project_ai_configs.findUnique.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(service.getProjectAiConfig(userId, projectId)).resolves.toMatchObject({
      projectId,
      provider: 'openai_compatible',
      model: 'gpt-5.2',
      temperature: '0.60',
      maxTokens: 2000,
      enableCharacterContext: true,
      enableSystemContext: true,
      enableWorldContext: true,
      enableMiscContext: true,
      enableChapterSummaryContext: false,
      enableProjectMemoryContext: false,
      contextLengthStrategy: 'BALANCED',
      resultApplyStrategy: 'CANDIDATE',
      asyncTaskThreshold: 3000,
    });
  });

  it('upserts AI config after confirming project ownership', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.project_ai_configs.upsert.mockResolvedValue({
      id: 1,
      projectId,
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
      temperature: new Prisma.Decimal('0.50'),
      maxTokens: 1500,
      enableCharacterContext: true,
      enableSystemContext: false,
      enableWorldContext: true,
      enableMiscContext: false,
      enableChapterSummaryContext: true,
      enableProjectMemoryContext: false,
      contextLengthStrategy: 'COMPACT',
      resultApplyStrategy: 'CANDIDATE',
      asyncTaskThreshold: 2000,
      createdAt: new Date('2026-06-23T08:00:00.000Z'),
      updatedAt: new Date('2026-06-23T08:00:00.000Z'),
    });

    const service = createService(prisma);

    await expect(
      service.upsertProjectAiConfig(userId, projectId, {
        provider: 'moonshot',
        model: 'moonshot-v1-8k',
        temperature: 0.5,
        maxTokens: 1500,
        enableSystemContext: false,
        enableMiscContext: false,
        enableChapterSummaryContext: true,
        contextLengthStrategy: 'COMPACT',
        asyncTaskThreshold: 2000,
      })
    ).resolves.toMatchObject({
      projectId,
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
      temperature: '0.50',
      maxTokens: 1500,
      contextLengthStrategy: 'COMPACT',
    });

    expect(prisma.project_ai_configs.upsert).toHaveBeenCalledWith({
      where: { projectId },
      create: {
        asyncTaskThreshold: 2000,
        contextLengthStrategy: 'COMPACT',
        defaultContinuePresetId: null,
        defaultExpandPresetId: null,
        defaultOutlinePresetId: null,
        defaultPolishPresetId: null,
        enableChapterSummaryContext: true,
        enableCharacterContext: true,
        enableMiscContext: false,
        enableProjectMemoryContext: false,
        enableSystemContext: false,
        enableWorldContext: true,
        maxTokens: 1500,
        model: 'moonshot-v1-8k',
        projectId,
        provider: 'moonshot',
        resultApplyStrategy: 'CANDIDATE',
        temperature: new Prisma.Decimal('0.50'),
      },
      update: {
        asyncTaskThreshold: 2000,
        contextLengthStrategy: 'COMPACT',
        enableChapterSummaryContext: true,
        enableMiscContext: false,
        enableSystemContext: false,
        maxTokens: 1500,
        model: 'moonshot-v1-8k',
        provider: 'moonshot',
        temperature: new Prisma.Decimal('0.50'),
      },
    });
  });

  it('upserts AI config with validated default prompt presets', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.count.mockResolvedValue(4);
    prisma.project_ai_configs.upsert.mockResolvedValue({
      id: 1,
      projectId,
      provider: 'moonshot',
      model: 'moonshot-v1-8k',
      temperature: new Prisma.Decimal('0.50'),
      maxTokens: 1500,
      defaultContinuePresetId: 301,
      defaultPolishPresetId: 302,
      defaultExpandPresetId: 303,
      defaultOutlinePresetId: 304,
      enableCharacterContext: true,
      enableSystemContext: true,
      enableWorldContext: true,
      enableMiscContext: true,
      enableChapterSummaryContext: false,
      enableProjectMemoryContext: false,
      contextLengthStrategy: 'BALANCED',
      resultApplyStrategy: 'CANDIDATE',
      asyncTaskThreshold: 3000,
      createdAt: new Date('2026-06-23T08:00:00.000Z'),
      updatedAt: new Date('2026-06-23T08:00:00.000Z'),
    });

    const service = createService(prisma);

    await expect(
      service.upsertProjectAiConfig(userId, projectId, {
        provider: 'moonshot',
        model: 'moonshot-v1-8k',
        temperature: 0.5,
        maxTokens: 1500,
        defaultContinuePresetId: 301,
        defaultPolishPresetId: 302,
        defaultExpandPresetId: 303,
        defaultOutlinePresetId: 304,
      })
    ).resolves.toMatchObject({
      defaultContinuePresetId: 301,
      defaultPolishPresetId: 302,
      defaultExpandPresetId: 303,
      defaultOutlinePresetId: 304,
    });

    expect(prisma.ai_prompt_presets.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { id: 301, taskType: 'MANUSCRIPT_CONTINUE', isEnabled: true },
          { id: 302, taskType: 'MANUSCRIPT_POLISH', isEnabled: true },
          { id: 303, taskType: 'MANUSCRIPT_EXPAND', isEnabled: true },
          { id: 304, taskType: 'OUTLINE_GENERATE', isEnabled: true },
        ],
        AND: [
          {
            OR: [
              { scope: 'SYSTEM' },
              { scope: 'USER', createdBy: userId },
              { scope: 'PROJECT', projectId },
            ],
          },
        ],
      },
    });
  });

  it('rejects AI config when a default prompt preset is not available for the project', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.count.mockResolvedValue(2);

    const service = createService(prisma);

    await expect(
      service.upsertProjectAiConfig(userId, projectId, {
        defaultContinuePresetId: 301,
        defaultPolishPresetId: 302,
        defaultExpandPresetId: 303,
      })
    ).rejects.toThrow(BadRequestException);
    expect(prisma.project_ai_configs.upsert).not.toHaveBeenCalled();
  });

  it('rejects AI config access for projects outside the current user', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(service.getProjectAiConfig(userId, projectId)).rejects.toThrow(NotFoundException);
    await expect(
      service.upsertProjectAiConfig(userId, projectId, {
        provider: 'openai',
      })
    ).rejects.toThrow(NotFoundException);
    expect(prisma.project_ai_configs.findUnique).not.toHaveBeenCalled();
    expect(prisma.project_ai_configs.upsert).not.toHaveBeenCalled();
  });

  it('lists enabled system presets, current user presets, and all current project presets', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.findMany.mockResolvedValue([
      {
        id: 301,
        scope: 'SYSTEM',
        projectId: null,
        isEnabled: true,
      },
      {
        id: 401,
        scope: 'USER',
        projectId: null,
        createdBy: userId,
        isEnabled: true,
      },
      {
        id: 501,
        scope: 'PROJECT',
        projectId,
        isEnabled: false,
      },
    ]);
    const service = createService(prisma);

    await expect(service.getProjectPromptPresets(userId, projectId)).resolves.toHaveLength(3);
    expect(prisma.ai_prompt_presets.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { scope: 'SYSTEM', isEnabled: true },
          { scope: 'USER', createdBy: userId, isEnabled: true },
          { scope: 'PROJECT', projectId },
        ],
      },
      orderBy: [{ taskType: 'asc' }, { scope: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('creates a project prompt preset with an initial immutable version', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.create.mockResolvedValue({
      id: 501,
      code: 'project-9-manuscript-continue-style',
      name: '项目续写风格',
      taskType: 'MANUSCRIPT_CONTINUE',
      scope: 'PROJECT',
      projectId,
      description: '偏爽文节奏',
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 1,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T00:00:00.000Z'),
      versions: [
        {
          id: 901,
          presetId: 501,
          version: 1,
          systemPrompt: '系统提示词',
          userPromptTemplate: '用户模板 {{customPrompt}}',
          outputFormat: 'TEXT',
          parameterSchema: null,
          notes: '初版',
          createdBy: userId,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        },
      ],
    });

    const service = createService(prisma);

    await expect(
      service.createProjectPromptPreset(userId, projectId, {
        code: 'manuscript-continue-style',
        name: '项目续写风格',
        taskType: 'MANUSCRIPT_CONTINUE',
        description: '偏爽文节奏',
        systemPrompt: '系统提示词',
        userPromptTemplate: '用户模板 {{customPrompt}}',
        outputFormat: 'TEXT',
        notes: '初版',
      })
    ).resolves.toMatchObject({
      id: 501,
      code: 'project-9-manuscript-continue-style',
      versions: [{ version: 1 }],
    });

    expect(prisma.ai_prompt_presets.create).toHaveBeenCalledWith({
      data: {
        code: 'project-9-manuscript-continue-style',
        name: '项目续写风格',
        taskType: 'MANUSCRIPT_CONTINUE',
        scope: 'PROJECT',
        projectId,
        description: '偏爽文节奏',
        isSystemPreset: false,
        isEnabled: true,
        latestVersion: 1,
        createdBy: userId,
        versions: {
          create: {
            version: 1,
            systemPrompt: '系统提示词',
            userPromptTemplate: '用户模板 {{customPrompt}}',
            outputFormat: 'TEXT',
            parameterSchema: undefined,
            notes: '初版',
            createdBy: userId,
          },
        },
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('creates a user prompt preset that can be reused across projects', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.create.mockResolvedValue({
      id: 401,
      code: 'user-100-personal-polish',
      name: '个人润色',
      taskType: 'MANUSCRIPT_POLISH',
      scope: 'USER',
      projectId: null,
      description: '个人常用润色风格',
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 1,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T00:00:00.000Z'),
      versions: [],
    });
    const service = createService(prisma);

    await expect(
      service.createUserPromptPreset(userId, projectId, {
        code: 'personal-polish',
        name: '个人润色',
        taskType: 'MANUSCRIPT_POLISH',
        description: '个人常用润色风格',
        systemPrompt: '系统提示词',
        userPromptTemplate: '用户模板',
        outputFormat: 'TEXT',
      })
    ).resolves.toMatchObject({
      id: 401,
      code: 'user-100-personal-polish',
      scope: 'USER',
      projectId: null,
      createdBy: userId,
    });

    expect(prisma.ai_prompt_presets.create).toHaveBeenCalledWith({
      data: {
        code: 'user-100-personal-polish',
        name: '个人润色',
        taskType: 'MANUSCRIPT_POLISH',
        scope: 'USER',
        projectId: null,
        description: '个人常用润色风格',
        isSystemPreset: false,
        isEnabled: true,
        latestVersion: 1,
        createdBy: userId,
        versions: {
          create: {
            version: 1,
            systemPrompt: '系统提示词',
            userPromptTemplate: '用户模板',
            outputFormat: 'TEXT',
            parameterSchema: undefined,
            notes: undefined,
            createdBy: userId,
          },
        },
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('appends a new project prompt preset version without overwriting history', async () => {
    const tx = createBasePrisma();
    tx.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 501,
      projectId,
      latestVersion: 1,
    });
    tx.ai_prompt_preset_versions.create.mockResolvedValue({
      id: 902,
      presetId: 501,
      version: 2,
      systemPrompt: '新系统提示词',
      userPromptTemplate: '新用户模板',
      outputFormat: 'TEXT',
      parameterSchema: null,
      notes: '第二版',
      createdBy: userId,
      createdAt: new Date('2026-06-26T01:00:00.000Z'),
    });
    tx.ai_prompt_presets.update.mockResolvedValue({
      id: 501,
      code: 'project-9-manuscript-continue-style',
      name: '项目续写风格',
      taskType: 'MANUSCRIPT_CONTINUE',
      scope: 'PROJECT',
      projectId,
      description: '偏爽文节奏',
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 2,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T01:00:00.000Z'),
      versions: [
        {
          id: 902,
          presetId: 501,
          version: 2,
          systemPrompt: '新系统提示词',
          userPromptTemplate: '新用户模板',
          outputFormat: 'TEXT',
          parameterSchema: null,
          notes: '第二版',
          createdBy: userId,
          createdAt: new Date('2026-06-26T01:00:00.000Z'),
        },
      ],
    });
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementation((callback: (txClient: MockPrismaService) => unknown) =>
      callback(tx)
    );

    const service = createService(prisma);

    await expect(
      service.appendProjectPromptPresetVersion(userId, projectId, 501, {
        systemPrompt: '新系统提示词',
        userPromptTemplate: '新用户模板',
        outputFormat: 'TEXT',
        notes: '第二版',
      })
    ).resolves.toMatchObject({
      id: 501,
      latestVersion: 2,
      versions: [{ version: 2 }],
    });

    expect(tx.ai_prompt_preset_versions.create).toHaveBeenCalledWith({
      data: {
        presetId: 501,
        version: 2,
        systemPrompt: '新系统提示词',
        userPromptTemplate: '新用户模板',
        outputFormat: 'TEXT',
        parameterSchema: undefined,
        notes: '第二版',
        createdBy: userId,
      },
    });
    expect(tx.ai_prompt_presets.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: { latestVersion: 2 },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('clones an available prompt preset into the project with its latest version', async () => {
    const tx = createBasePrisma();
    tx.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 301,
      code: 'system-continue',
      name: '系统续写',
      taskType: 'MANUSCRIPT_CONTINUE',
      scope: 'SYSTEM',
      projectId: null,
      description: '系统内置续写预设',
      isSystemPreset: true,
      isEnabled: true,
      latestVersion: 3,
      createdBy: null,
      versions: [
        {
          id: 903,
          presetId: 301,
          version: 3,
          systemPrompt: '最新系统提示词',
          userPromptTemplate: '最新用户模板',
          outputFormat: 'TEXT',
          parameterSchema: { tone: 'string' },
          notes: '第三版',
          createdBy: null,
          createdAt: new Date('2026-06-26T03:00:00.000Z'),
        },
      ],
    });
    tx.ai_prompt_presets.create.mockResolvedValue({
      id: 502,
      code: 'project-9-clone-301',
      name: '系统续写 副本',
      taskType: 'MANUSCRIPT_CONTINUE',
      scope: 'PROJECT',
      projectId,
      description: '系统内置续写预设',
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 1,
      createdBy: userId,
      createdAt: new Date('2026-06-26T03:10:00.000Z'),
      updatedAt: new Date('2026-06-26T03:10:00.000Z'),
      versions: [
        {
          id: 904,
          presetId: 502,
          version: 1,
          systemPrompt: '最新系统提示词',
          userPromptTemplate: '最新用户模板',
          outputFormat: 'TEXT',
          parameterSchema: { tone: 'string' },
          notes: '从「系统续写」克隆：第三版',
          createdBy: userId,
          createdAt: new Date('2026-06-26T03:10:00.000Z'),
        },
      ],
    });
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementation((callback: (client: MockPrismaService) => unknown) =>
      callback(tx)
    );
    const service = createService(prisma);

    await expect(service.cloneProjectPromptPreset(userId, projectId, 301)).resolves.toMatchObject({
      id: 502,
      code: 'project-9-clone-301',
      scope: 'PROJECT',
      versions: [{ version: 1, systemPrompt: '最新系统提示词' }],
    });

    expect(tx.ai_prompt_presets.findFirst).toHaveBeenCalledWith({
      where: {
        id: 301,
        isEnabled: true,
        OR: [
          { scope: 'SYSTEM' },
          { scope: 'USER', createdBy: userId },
          { scope: 'PROJECT', projectId },
        ],
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    expect(tx.ai_prompt_presets.create).toHaveBeenCalledWith({
      data: {
        code: 'project-9-clone-301',
        name: '系统续写 副本',
        taskType: 'MANUSCRIPT_CONTINUE',
        scope: 'PROJECT',
        projectId,
        description: '系统内置续写预设',
        isSystemPreset: false,
        isEnabled: true,
        latestVersion: 1,
        createdBy: userId,
        versions: {
          create: {
            version: 1,
            systemPrompt: '最新系统提示词',
            userPromptTemplate: '最新用户模板',
            outputFormat: 'TEXT',
            parameterSchema: { tone: 'string' },
            notes: '从「系统续写」克隆：第三版',
            createdBy: userId,
          },
        },
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('updates project prompt preset metadata without changing versions', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 501,
      projectId,
      scope: 'PROJECT',
      isEnabled: true,
    });
    prisma.ai_prompt_presets.update.mockResolvedValue({
      id: 501,
      code: 'project-9-calm-continue',
      name: '冷静续写',
      taskType: 'MANUSCRIPT_CONTINUE',
      scope: 'PROJECT',
      projectId,
      description: '更克制的叙述节奏',
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 2,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T04:00:00.000Z'),
      versions: [
        {
          id: 902,
          presetId: 501,
          version: 2,
          systemPrompt: '第二版系统提示词',
          userPromptTemplate: '第二版用户模板',
          outputFormat: 'TEXT',
          parameterSchema: null,
          notes: '第二版',
          createdBy: userId,
          createdAt: new Date('2026-06-26T01:00:00.000Z'),
        },
      ],
    });
    const service = createService(prisma);

    await expect(
      service.updateProjectPromptPreset(userId, projectId, 501, {
        code: 'calm-continue',
        name: '冷静续写',
        description: '更克制的叙述节奏',
      })
    ).resolves.toMatchObject({
      id: 501,
      code: 'project-9-calm-continue',
      name: '冷静续写',
      description: '更克制的叙述节奏',
      latestVersion: 2,
    });

    expect(prisma.ai_prompt_presets.findFirst).toHaveBeenCalledWith({
      where: {
        id: 501,
        projectId,
        scope: 'PROJECT',
      },
    });
    expect(prisma.ai_prompt_presets.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: {
        code: 'project-9-calm-continue',
        name: '冷静续写',
        description: '更克制的叙述节奏',
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    expect(prisma.ai_prompt_preset_versions.create).not.toHaveBeenCalled();
  });

  it('updates user prompt preset metadata without changing versions', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 401,
      projectId: null,
      scope: 'USER',
      createdBy: userId,
      isEnabled: true,
    });
    prisma.ai_prompt_presets.update.mockResolvedValue({
      id: 401,
      code: 'user-100-calm-polish',
      name: '个人冷静润色',
      taskType: 'MANUSCRIPT_POLISH',
      scope: 'USER',
      projectId: null,
      description: '个人常用克制风格',
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 1,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T04:00:00.000Z'),
      versions: [],
    });
    const service = createService(prisma);

    await expect(
      service.updateUserPromptPreset(userId, projectId, 401, {
        code: 'calm-polish',
        name: '个人冷静润色',
        description: '个人常用克制风格',
      })
    ).resolves.toMatchObject({
      id: 401,
      code: 'user-100-calm-polish',
      scope: 'USER',
      projectId: null,
    });

    expect(prisma.ai_prompt_presets.findFirst).toHaveBeenCalledWith({
      where: {
        id: 401,
        createdBy: userId,
        scope: 'USER',
      },
    });
    expect(prisma.ai_prompt_presets.update).toHaveBeenCalledWith({
      where: { id: 401 },
      data: {
        code: 'user-100-calm-polish',
        name: '个人冷静润色',
        description: '个人常用克制风格',
      },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    expect(prisma.ai_prompt_preset_versions.create).not.toHaveBeenCalled();
  });

  it('appends a new user prompt preset version without overwriting history', async () => {
    const tx = createBasePrisma();
    tx.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 401,
      projectId: null,
      scope: 'USER',
      createdBy: userId,
      latestVersion: 1,
      isEnabled: true,
    });
    tx.ai_prompt_preset_versions.create.mockResolvedValue({
      id: 905,
      presetId: 401,
      version: 2,
      systemPrompt: '个人新系统提示词',
      userPromptTemplate: '个人新用户模板',
      outputFormat: 'TEXT',
      parameterSchema: null,
      notes: '个人第二版',
      createdBy: userId,
      createdAt: new Date('2026-06-26T01:00:00.000Z'),
    });
    tx.ai_prompt_presets.update.mockResolvedValue({
      id: 401,
      code: 'user-100-personal-polish',
      name: '个人润色',
      taskType: 'MANUSCRIPT_POLISH',
      scope: 'USER',
      projectId: null,
      description: null,
      isSystemPreset: false,
      isEnabled: true,
      latestVersion: 2,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T01:00:00.000Z'),
      versions: [{ version: 2 }],
    });
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementation((callback: (txClient: MockPrismaService) => unknown) =>
      callback(tx)
    );
    const service = createService(prisma);

    await expect(
      service.appendUserPromptPresetVersion(userId, projectId, 401, {
        systemPrompt: '个人新系统提示词',
        userPromptTemplate: '个人新用户模板',
        outputFormat: 'TEXT',
        notes: '个人第二版',
      })
    ).resolves.toMatchObject({
      id: 401,
      latestVersion: 2,
      versions: [{ version: 2 }],
    });

    expect(tx.ai_prompt_presets.findFirst).toHaveBeenCalledWith({
      where: {
        id: 401,
        createdBy: userId,
        scope: 'USER',
        isEnabled: true,
      },
    });
    expect(tx.ai_prompt_preset_versions.create).toHaveBeenCalledWith({
      data: {
        presetId: 401,
        version: 2,
        systemPrompt: '个人新系统提示词',
        userPromptTemplate: '个人新用户模板',
        outputFormat: 'TEXT',
        parameterSchema: undefined,
        notes: '个人第二版',
        createdBy: userId,
      },
    });
    expect(tx.ai_prompt_presets.update).toHaveBeenCalledWith({
      where: { id: 401 },
      data: { latestVersion: 2 },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('disables a user prompt preset and clears every default reference to that preset', async () => {
    const tx = createBasePrisma();
    tx.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 401,
      projectId: null,
      scope: 'USER',
      createdBy: userId,
      taskType: 'MANUSCRIPT_POLISH',
      isEnabled: true,
    });
    tx.project_ai_configs.updateMany.mockResolvedValue({ count: 2 });
    tx.ai_prompt_presets.update.mockResolvedValue({
      id: 401,
      code: 'user-100-personal-polish',
      name: '个人润色',
      taskType: 'MANUSCRIPT_POLISH',
      scope: 'USER',
      projectId: null,
      description: null,
      isSystemPreset: false,
      isEnabled: false,
      latestVersion: 2,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T02:00:00.000Z'),
      versions: [],
    });
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementation((callback: (txClient: MockPrismaService) => unknown) =>
      callback(tx)
    );
    const service = createService(prisma);

    await expect(service.disableUserPromptPreset(userId, projectId, 401)).resolves.toMatchObject({
      id: 401,
      isEnabled: false,
    });

    expect(tx.project_ai_configs.updateMany).toHaveBeenCalledWith({
      where: { defaultPolishPresetId: 401 },
      data: { defaultPolishPresetId: null },
    });
    expect(tx.project_ai_configs.upsert).not.toHaveBeenCalled();
    expect(tx.ai_prompt_presets.update).toHaveBeenCalledWith({
      where: { id: 401 },
      data: { isEnabled: false },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('disables a project prompt preset and clears default references', async () => {
    const tx = createBasePrisma();
    tx.ai_prompt_presets.findFirst.mockResolvedValue({
      id: 501,
      projectId,
      scope: 'PROJECT',
      taskType: 'MANUSCRIPT_CONTINUE',
      isEnabled: true,
    });
    tx.project_ai_configs.upsert.mockResolvedValue({});
    tx.ai_prompt_presets.update.mockResolvedValue({
      id: 501,
      code: 'project-9-manuscript-continue-style',
      name: '项目续写风格',
      taskType: 'MANUSCRIPT_CONTINUE',
      scope: 'PROJECT',
      projectId,
      description: '偏爽文节奏',
      isSystemPreset: false,
      isEnabled: false,
      latestVersion: 2,
      createdBy: userId,
      createdAt: new Date('2026-06-26T00:00:00.000Z'),
      updatedAt: new Date('2026-06-26T02:00:00.000Z'),
      versions: [],
    });
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementation((callback: (client: MockPrismaService) => unknown) =>
      callback(tx)
    );
    const service = createService(prisma);

    await expect(service.disableProjectPromptPreset(userId, projectId, 501)).resolves.toMatchObject(
      {
        id: 501,
        isEnabled: false,
      }
    );
    const aiConfigUpsert = tx.project_ai_configs.upsert as jest.Mock<
      Promise<unknown>,
      [ProjectAiConfigUpsertArgs]
    >;
    const aiConfigUpsertArg = aiConfigUpsert.mock.calls[0]?.[0];
    expect(aiConfigUpsertArg).toBeDefined();
    expect(aiConfigUpsertArg?.where).toEqual({ projectId });
    expect(aiConfigUpsertArg?.create).toMatchObject({ projectId });
    expect(aiConfigUpsertArg?.update).toEqual({
      defaultContinuePresetId: null,
    });
    expect(tx.ai_prompt_presets.update).toHaveBeenCalledWith({
      where: { id: 501 },
      data: { isEnabled: false },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
  });

  it('allows project members to read shared projects', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: projectId,
      userId: 200,
      name: '协作项目',
    });
    prisma.project_members.findUnique.mockResolvedValue({
      projectId,
      userId,
      role: 'EDITOR',
    });

    const service = createService(prisma);

    await expect(service.getProjectById(userId, projectId)).resolves.toMatchObject({
      id: projectId,
      name: '协作项目',
    });
    expect(prisma.project_members.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });
  });

  it('lists project memory items for users with project read access', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.project_memory_items.findMany.mockResolvedValue([
      {
        id: 701,
        projectId,
        category: 'STYLE',
        title: '叙事口吻',
        content: '保持冷静克制的第三人称。',
        priority: 10,
        sourceType: 'MANUAL',
        sourceId: null,
        status: 'ACTIVE',
        createdBy: userId,
        createdAt: new Date('2026-06-26T08:00:00.000Z'),
        updatedAt: new Date('2026-06-26T08:00:00.000Z'),
      },
    ]);

    const service = createService(prisma);

    await expect(service.listProjectMemoryItems(userId, projectId)).resolves.toEqual([
      expect.objectContaining({
        id: 701,
        category: 'STYLE',
        title: '叙事口吻',
      }),
    ]);
    expect(prisma.project_memory_items.findMany).toHaveBeenCalledWith({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  });

  it('creates a project memory item for users with project write access', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.project_memory_items.create.mockResolvedValue({
      id: 702,
      projectId,
      category: 'CONSTRAINT',
      title: '称谓约束',
      content: '主角称呼师父为先生。',
      priority: 5,
      sourceType: 'MANUAL',
      sourceId: null,
      status: 'ACTIVE',
      createdBy: userId,
      createdAt: new Date('2026-06-26T08:10:00.000Z'),
      updatedAt: new Date('2026-06-26T08:10:00.000Z'),
    });

    const service = createService(prisma);

    await expect(
      service.createProjectMemoryItem(userId, projectId, {
        category: 'CONSTRAINT',
        title: '称谓约束',
        content: '主角称呼师父为先生。',
        priority: 5,
      })
    ).resolves.toMatchObject({
      id: 702,
      category: 'CONSTRAINT',
      title: '称谓约束',
    });
    expect(prisma.project_memory_items.create).toHaveBeenCalledWith({
      data: {
        projectId,
        category: 'CONSTRAINT',
        title: '称谓约束',
        content: '主角称呼师父为先生。',
        priority: 5,
        sourceType: 'MANUAL',
        sourceId: null,
        status: 'ACTIVE',
        createdBy: userId,
      },
    });
  });

  it('updates a project memory item within the current project', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.project_memory_items.update.mockResolvedValue({
      id: 702,
      projectId,
      category: 'CONSTRAINT',
      title: '称谓约束',
      content: '主角只在正式场合称呼师父为先生。',
      priority: 8,
      sourceType: 'MANUAL',
      sourceId: null,
      status: 'ACTIVE',
      createdBy: userId,
      createdAt: new Date('2026-06-26T08:10:00.000Z'),
      updatedAt: new Date('2026-06-26T08:20:00.000Z'),
    });

    const service = createService(prisma);

    await expect(
      service.updateProjectMemoryItem(userId, projectId, 702, {
        content: '主角只在正式场合称呼师父为先生。',
        priority: 8,
      })
    ).resolves.toMatchObject({
      id: 702,
      content: '主角只在正式场合称呼师父为先生。',
      priority: 8,
    });
    expect(prisma.project_memory_items.update).toHaveBeenCalledWith({
      where: {
        id: 702,
        projectId,
      },
      data: {
        content: '主角只在正式场合称呼师父为先生。',
        priority: 8,
      },
    });
  });

  it('deletes a project memory item within the current project', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.project_memory_items.delete.mockResolvedValue({
      id: 702,
      projectId,
    });

    const service = createService(prisma);

    await expect(service.deleteProjectMemoryItem(userId, projectId, 702)).resolves.toEqual({
      message: '项目记忆已删除',
    });
    expect(prisma.project_memory_items.delete).toHaveBeenCalledWith({
      where: {
        id: 702,
        projectId,
      },
    });
  });

  it('lists active project knowledge documents for users with read access', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.knowledge_documents.findMany.mockResolvedValue([
      {
        id: 801,
        projectId,
        title: '门派制度',
        documentType: 'NOTE',
        content: '宗门分内外门。',
        source: 'manual',
        status: 'ACTIVE',
        createdBy: userId,
        createdAt: new Date('2026-06-26T09:00:00.000Z'),
        updatedAt: new Date('2026-06-26T09:00:00.000Z'),
      },
    ]);

    const service = createService(prisma);

    await expect(service.listProjectKnowledgeDocuments(userId, projectId)).resolves.toEqual([
      expect.objectContaining({
        id: 801,
        title: '门派制度',
        documentType: 'NOTE',
      }),
    ]);
    expect(prisma.knowledge_documents.findMany).toHaveBeenCalledWith({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('creates a project knowledge document and chunks its content', async () => {
    const prisma = createBasePrisma();
    const tx = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementationOnce(
      (callback: (tx: MockPrismaService) => Promise<unknown>) => callback(tx)
    );
    tx.knowledge_documents.create.mockResolvedValue({
      id: 802,
      projectId,
      title: '人物关系',
      documentType: 'NOTE',
      content: '主角与师父互相信任。师兄暗中试探主角。',
      source: 'manual',
      status: 'ACTIVE',
      createdBy: userId,
      createdAt: new Date('2026-06-26T09:10:00.000Z'),
      updatedAt: new Date('2026-06-26T09:10:00.000Z'),
    });

    const service = createService(prisma);

    await expect(
      service.createProjectKnowledgeDocument(userId, projectId, {
        title: '人物关系',
        documentType: 'NOTE',
        content: '主角与师父互相信任。师兄暗中试探主角。',
      })
    ).resolves.toMatchObject({
      id: 802,
      title: '人物关系',
    });
    expect(tx.knowledge_documents.create).toHaveBeenCalledWith({
      data: {
        projectId,
        title: '人物关系',
        documentType: 'NOTE',
        content: '主角与师父互相信任。师兄暗中试探主角。',
        source: 'MANUAL',
        status: 'ACTIVE',
        createdBy: userId,
      },
    });
    expect(tx.knowledge_chunks.createMany).toHaveBeenCalledWith({
      data: [
        {
          documentId: 802,
          projectId,
          chunkIndex: 0,
          content: '主角与师父互相信任。师兄暗中试探主角。',
          keywords: [],
          summary: null,
        },
      ],
    });
  });

  it('updates a project knowledge document and rebuilds its chunks', async () => {
    const prisma = createBasePrisma();
    const tx = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.$transaction.mockImplementationOnce(
      (callback: (tx: MockPrismaService) => Promise<unknown>) => callback(tx)
    );
    tx.knowledge_documents.update.mockResolvedValue({
      id: 802,
      projectId,
      title: '人物关系',
      documentType: 'NOTE',
      content: '师兄确认主角身份。',
      source: 'MANUAL',
      status: 'ACTIVE',
      createdBy: userId,
      createdAt: new Date('2026-06-26T09:10:00.000Z'),
      updatedAt: new Date('2026-06-26T09:20:00.000Z'),
    });

    const service = createService(prisma);

    await expect(
      service.updateProjectKnowledgeDocument(userId, projectId, 802, {
        content: '师兄确认主角身份。',
      })
    ).resolves.toMatchObject({
      id: 802,
      content: '师兄确认主角身份。',
    });
    expect(tx.knowledge_documents.update).toHaveBeenCalledWith({
      where: {
        id: 802,
        projectId,
      },
      data: {
        content: '师兄确认主角身份。',
      },
    });
    expect(tx.knowledge_chunks.deleteMany).toHaveBeenCalledWith({
      where: { documentId: 802 },
    });
    expect(tx.knowledge_chunks.createMany).toHaveBeenCalledWith({
      data: [
        {
          documentId: 802,
          projectId,
          chunkIndex: 0,
          content: '师兄确认主角身份。',
          keywords: [],
          summary: null,
        },
      ],
    });
  });

  it('deletes a project knowledge document within the current project', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: projectId, userId });
    prisma.knowledge_documents.delete.mockResolvedValue({
      id: 802,
      projectId,
    });

    const service = createService(prisma);

    await expect(service.deleteProjectKnowledgeDocument(userId, projectId, 802)).resolves.toEqual({
      message: '项目资料已删除',
    });
    expect(prisma.knowledge_documents.delete).toHaveBeenCalledWith({
      where: {
        id: 802,
        projectId,
      },
    });
  });
});
