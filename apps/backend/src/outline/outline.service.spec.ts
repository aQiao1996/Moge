import { AiTaskType } from '../../generated/prisma';
import type { AiJob } from '@moge/types';
import type { PrismaService } from '../prisma/prisma.service';
import type { AIService } from '../ai/ai.service';
import type { SensitiveFilterService } from '../sensitive-filter/sensitive-filter.service';
import type { MarkdownParserService } from './markdown-parser.service';
import type { AiJobsService } from '../ai-jobs/ai-jobs.service';
import { OutlineService } from './outline.service';

function createService(
  prisma: unknown,
  aiJobsService: unknown,
  sensitiveFilter: unknown = {
    checkDetailed: jest.fn().mockReturnValue({ hasSensitive: false, sensitiveWords: [] }),
  }
) {
  return new OutlineService(
    prisma as PrismaService,
    {} as AIService,
    sensitiveFilter as SensitiveFilterService,
    {} as MarkdownParserService,
    aiJobsService as AiJobsService
  );
}

describe('OutlineService create', () => {
  it('connects an accessible project when creating an outline', async () => {
    type ProjectFindFirstArgs = { where: { id: number; userId: number } };
    type OutlineCreateArgs = {
      data: {
        name?: string;
        project?: {
          connect: {
            id: number;
          };
        };
      };
    };
    const createdOutline = {
      id: 11,
      name: '新大纲',
      type: 'fantasy',
      era: null,
      conflict: null,
      tags: [],
      remark: null,
      projectId: 9,
      characters: [],
      systems: [],
      worlds: [],
      misc: [],
      status: 'DRAFT',
      userId: 100,
      createdAt: new Date('2026-06-29T00:00:00.000Z'),
      updatedAt: new Date('2026-06-29T00:00:00.000Z'),
    };
    const projectsFindFirst = jest
      .fn<Promise<{ id: number; userId: number } | null>, [ProjectFindFirstArgs]>()
      .mockResolvedValue({ id: 9, userId: 100 });
    const outlineCreate = jest
      .fn<Promise<typeof createdOutline>, [OutlineCreateArgs]>()
      .mockResolvedValue(createdOutline);
    const prisma = {
      projects: {
        findFirst: projectsFindFirst,
      },
      outline: {
        create: outlineCreate,
      },
    };
    const service = createService(prisma, { createJob: jest.fn() });

    await expect(
      service.create('100', {
        name: '新大纲',
        type: 'fantasy',
        projectId: 9,
      })
    ).resolves.toMatchObject({
      id: '11',
      userId: '100',
      projectId: 9,
    });

    expect(projectsFindFirst).toHaveBeenCalledWith({
      where: { id: 9, userId: 100 },
    });
    const createArg = outlineCreate.mock.calls[0]?.[0];
    expect(createArg?.data.name).toBe('新大纲');
    expect(createArg?.data.project).toEqual({
      connect: { id: 9 },
    });
  });
});

describe('OutlineService AI jobs', () => {
  it('creates an outline generation job for an owned outline', async () => {
    const createdAt = new Date('2026-06-26T09:00:00.000Z');
    const prisma = {
      outline: {
        findUnique: jest.fn().mockResolvedValue({
          id: 11,
          userId: 100,
          projectId: 9,
        }),
      },
    };
    const aiJobsService = {
      createJob: jest.fn().mockResolvedValue({
        id: 801,
        userId: 100,
        projectId: 9,
        outlineId: 11,
        taskType: AiTaskType.OUTLINE_GENERATE,
        status: 'QUEUED',
        createdAt: createdAt.toISOString(),
      }),
    };
    const service = createService(prisma, aiJobsService);

    const job = await service.createOutlineGenerateJob(11, '100');

    expect(prisma.outline.findUnique).toHaveBeenCalledWith({
      where: { id: 11 },
    });
    expect(aiJobsService.createJob).toHaveBeenCalledWith(100, {
      projectId: 9,
      outlineId: 11,
      taskType: AiTaskType.OUTLINE_GENERATE,
      inputPayload: {
        outlineId: 11,
      },
      contextMeta: {
        source: 'outline.generate',
      },
      maxRetries: 2,
    });
    expect(job).toMatchObject({
      id: 801,
      outlineId: 11,
      taskType: 'OUTLINE_GENERATE',
      status: 'QUEUED',
    });
  });

  it('processes an outline generation job and returns a result summary', async () => {
    const service = createService(
      {
        outline: {
          findUnique: jest.fn(),
        },
      },
      {
        createJob: jest.fn(),
      }
    );
    const generateContentForJobSpy = jest
      .spyOn(service, 'generateContentForJob')
      .mockResolvedValue('生成的大纲内容');

    const summary = await service.processOutlineGenerateJob({
      id: 802,
      userId: 100,
      outlineId: 11,
      taskType: AiTaskType.OUTLINE_GENERATE,
    } as AiJob);

    expect(generateContentForJobSpy).toHaveBeenCalledWith(11, '100');
    expect(summary).toEqual({
      outlineId: 11,
      contentLength: 7,
    });
  });

  it('uses project AI config and default outline prompt when generating content for a job', async () => {
    const generatedContent = '项目化大纲';
    const stream: AsyncIterable<string> = {
      async *[Symbol.asyncIterator]() {
        await Promise.resolve();
        yield generatedContent;
      },
    };
    const configuredModel = {};
    const aiService = {
      getConfiguredStreamingModel: jest.fn().mockReturnValue(configuredModel),
    };
    const outlineFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: 11,
        name: '项目大纲',
        type: 'fantasy',
        era: 'modern',
        conflict: 'conflict',
        tags: ['tag'],
        remark: 'remark',
        userId: 100,
        projectId: 9,
        project: {
          aiConfig: {
            provider: 'openai_compatible',
            model: 'v2-outline-model',
            temperature: { toString: () => '0.70' },
            maxTokens: 3333,
            defaultOutlinePresetId: 501,
          },
        },
      })
      .mockResolvedValueOnce({
        id: 11,
        name: '项目大纲',
        type: 'fantasy',
        era: 'modern',
        conflict: 'conflict',
        tags: ['tag'],
        remark: 'remark',
        userId: 100,
        projectId: 9,
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      });
    type GenerationRecordCreateArgs = { data: Record<string, unknown> };
    const generationCreate = jest
      .fn<Promise<{ id: number; createdAt: Date }>, [GenerationRecordCreateArgs]>()
      .mockResolvedValue({
        id: 901,
        createdAt: new Date('2026-06-29T00:00:00.000Z'),
      });
    const prisma = {
      outline: {
        findUnique: outlineFindUnique,
      },
      ai_prompt_presets: {
        findFirst: jest.fn().mockResolvedValue({
          id: 501,
          versions: [
            {
              version: 3,
              systemPrompt: '系统 {{project_name}}',
              userPromptTemplate: '用户 {{project_name}} {{settings_context}}',
            },
          ],
        }),
      },
      ai_generation_records: {
        create: generationCreate,
      },
      character_settings: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      system_settings: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      world_settings: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      misc_settings: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      outline_content: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (operation: (tx: unknown) => Promise<unknown>) =>
        operation({
          $executeRaw: jest.fn(),
          outline_content: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
        })
      ),
    };
    const markdownParser = {
      parseOutlineMarkdown: jest.fn().mockResolvedValue({ volumes: [], directChapters: [] }),
      validateParsedStructure: jest.fn().mockReturnValue(false),
    };
    const service = new OutlineService(
      prisma as unknown as PrismaService,
      aiService as unknown as AIService,
      { checkDetailed: jest.fn() } as unknown as SensitiveFilterService,
      markdownParser as unknown as MarkdownParserService,
      { createJob: jest.fn() } as unknown as AiJobsService
    );
    const streamMock = jest.fn().mockResolvedValue(stream);
    const promptPipeMock = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        stream: streamMock,
      }),
    });
    jest.spyOn(service, 'createPromptTemplate').mockReturnValue({
      pipe: promptPipeMock,
    } as never);

    await expect(service.generateContentForJob(11, '100')).resolves.toBe(generatedContent);

    expect(aiService.getConfiguredStreamingModel).toHaveBeenCalledWith({
      provider: 'openai_compatible',
      model: 'v2-outline-model',
      temperature: 0.7,
      maxTokens: 3333,
    });
    expect(promptPipeMock).toHaveBeenCalledWith(configuredModel);
    expect(prisma.ai_prompt_presets.findFirst).toHaveBeenCalledWith({
      where: {
        id: 501,
        taskType: AiTaskType.OUTLINE_GENERATE,
        isEnabled: true,
        OR: [
          { scope: 'SYSTEM' },
          { scope: 'USER', createdBy: 100 },
          { scope: 'PROJECT', projectId: 9 },
        ],
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    const generationCreateArg = generationCreate.mock.calls[0]?.[0];
    expect(generationCreateArg?.data).toMatchObject({
      projectId: 9,
      outlineId: 11,
      taskType: AiTaskType.OUTLINE_GENERATE,
      provider: 'openai_compatible',
      model: 'v2-outline-model',
      presetId: 501,
      presetVersion: 3,
      outputText: generatedContent,
      status: 'SUCCESS',
    });
  });
});
