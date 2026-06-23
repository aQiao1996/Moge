import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import type { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

interface MockPrismaService {
  projects: {
    findFirst: jest.Mock;
  };
  project_ai_configs: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
}

function createBasePrisma(): MockPrismaService {
  return {
    projects: {
      findFirst: jest.fn(),
    },
    project_ai_configs: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  } as unknown as MockPrismaService;
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
});
