import { Prisma } from '../../generated/prisma';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { PrismaService } from '../prisma/prisma.service';
import type { AIService } from '../ai/ai.service';
import type { AiJobsService } from '../ai-jobs/ai-jobs.service';
import { ManuscriptsService } from './manuscripts.service';

describe('ManuscriptsService project AI config and scheduling', () => {
  function createService(
    prisma: unknown,
    aiService?: Partial<AIService>,
    aiJobsService?: Partial<AiJobsService>
  ) {
    return new ManuscriptsService(
      prisma as PrismaService,
      {
        getConfiguredStreamingModel: jest.fn(),
        getDefaultStreamingModel: jest.fn(),
        ...aiService,
      } as unknown as AIService,
      aiJobsService as AiJobsService | undefined
    );
  }

  it('returns an AI candidate response and persists generation metadata', async () => {
    const invoke = jest.fn().mockResolvedValue('生成结果');
    const pipe = jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) });
    const model = {};
    const aiService = {
      getConfiguredStreamingModel: jest.fn().mockReturnValue(model),
    };
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          title: '第一章',
          manuscriptId: 3,
          volumeId: null,
          sortOrder: new Prisma.Decimal('1.00000'),
          content: { content: '已有内容' },
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
        }),
        findMany: jest.fn(),
      },
      manuscripts: {
        findFirst: jest.fn().mockResolvedValue({
          id: 3,
          projectId: 9,
          characters: ['1'],
          systems: ['2'],
          worlds: ['3'],
          misc: ['4'],
          volumes: [],
          chapters: [],
        }),
      },
      projects: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          userId: 100,
          characters: ['1'],
          systems: ['2'],
          worlds: ['3'],
          misc: ['4'],
          aiConfig: {
            provider: 'moonshot',
            model: 'moonshot-v1-32k',
            temperature: new Prisma.Decimal('0.40'),
            maxTokens: 4096,
            enableCharacterContext: true,
            enableSystemContext: false,
            enableWorldContext: true,
            enableMiscContext: false,
            enableChapterSummaryContext: false,
            contextLengthStrategy: 'COMPACT',
            resultApplyStrategy: 'CANDIDATE',
            defaultContinuePresetId: 301,
            defaultPolishPresetId: null,
            defaultExpandPresetId: null,
            asyncTaskThreshold: 3000,
          },
        }),
      },
      ai_prompt_presets: {
        findFirst: jest.fn().mockResolvedValue({
          id: 301,
          latestVersion: 2,
          versions: [
            {
              version: 2,
              systemPrompt: '系统预设：{{settingsContext}}',
              userPromptTemplate:
                '正文：{{currentContent}}\n要求：{{customPrompt}}\n任务：{{taskType}}',
              outputFormat: 'TEXT',
              parameterSchema: null,
              notes: null,
            },
          ],
        }),
      },
      character_settings: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, name: '主角', background: '孤儿' }]),
      },
      system_settings: {
        findMany: jest.fn().mockResolvedValue([{ id: 2, name: '系统', description: '升级' }]),
      },
      world_settings: {
        findMany: jest.fn().mockResolvedValue([{ id: 3, name: '世界', description: '仙侠' }]),
      },
      misc_settings: {
        findMany: jest.fn().mockResolvedValue([{ id: 4, name: '辅助', description: '伏笔' }]),
      },
      ai_generation_records: {
        create: jest.fn((args: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 101,
            jobId: null,
            projectId: 9,
            taskType: args.data.taskType,
            provider: 'moonshot',
            model: 'moonshot-v1-32k',
            presetId: args.data.presetId,
            presetVersion: args.data.presetVersion,
            requestPayload: {},
            contextSnapshot: {},
            outputText: '生成结果',
            tokenUsage: null,
            latencyMs: 120,
            status: 'SUCCESS',
            errorMessage: null,
            createdAt: new Date('2026-06-26T00:00:00.000Z'),
          })
        ),
      },
      ai_generation_candidates: {
        create: jest.fn((args: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 202,
            generationRecordId: args.data.generationRecordId,
            projectId: 9,
            outlineId: null,
            manuscriptId: 3,
            chapterId: 7,
            candidateType: 'TEXT',
            targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
            targetId: 7,
            targetContentVersion: 1,
            expectedContentHash: null,
            content: '生成结果',
            diffMeta: null,
            applyStatus: 'PENDING',
            appliedBy: null,
            appliedAt: null,
            applyMode: null,
            appliedContentVersion: null,
            createdAt: new Date('2026-06-26T00:00:00.000Z'),
          })
        ),
      },
    };
    const fromMessagesSpy = jest
      .spyOn(ChatPromptTemplate, 'fromMessages')
      .mockReturnValue({ pipe } as never);

    const service = createService(prisma, aiService);

    const response = await service.continueChapter(7, 100);

    expect(response).toMatchObject({
      generationRecord: {
        id: 101,
        taskType: 'MANUSCRIPT_CONTINUE',
        outputText: '生成结果',
      },
      candidate: {
        id: 202,
        content: '生成结果',
        applyStatus: 'PENDING',
      },
      effectiveConfig: {
        provider: 'moonshot',
        model: 'moonshot-v1-32k',
        defaultPresetId: 301,
      },
    });
    expect(response.contextSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceType: 'CHARACTER', sourceName: '角色', included: true }),
        expect.objectContaining({ sourceType: 'SYSTEM', sourceName: '系统', included: false }),
        expect.objectContaining({ sourceType: 'WORLD', sourceName: '世界', included: true }),
        expect.objectContaining({ sourceType: 'MISC', sourceName: '辅助', included: false }),
      ])
    );

    expect(aiService.getConfiguredStreamingModel).toHaveBeenCalledWith({
      provider: 'moonshot',
      model: 'moonshot-v1-32k',
      temperature: 0.4,
      maxTokens: 4096,
    });
    expect(prisma.system_settings.findMany).not.toHaveBeenCalled();
    expect(prisma.misc_settings.findMany).not.toHaveBeenCalled();
    expect(prisma.manuscript_chapter.findMany).not.toHaveBeenCalled();
    expect(fromMessagesSpy).toHaveBeenCalledWith([
      ['system', expect.stringContaining('系统预设：')],
      ['human', expect.stringContaining('要求：')],
    ]);
    expect(pipe).toHaveBeenCalledWith(model);
    const generationCreate = prisma.ai_generation_records.create as jest.MockedFunction<
      (args: { data: Record<string, unknown> }) => Promise<unknown>
    >;
    const candidateCreate = prisma.ai_generation_candidates.create as jest.MockedFunction<
      (args: { data: Record<string, unknown> }) => Promise<unknown>
    >;
    const generationCreateArg = generationCreate.mock.calls[0]?.[0];
    const candidateCreateArg = candidateCreate.mock.calls[0]?.[0];
    expect(generationCreateArg).toBeDefined();
    expect(candidateCreateArg).toBeDefined();
    expect(generationCreateArg.data).toMatchObject({
      taskType: 'MANUSCRIPT_CONTINUE',
      provider: 'moonshot',
      model: 'moonshot-v1-32k',
      presetId: 301,
      presetVersion: 2,
      outputText: '生成结果',
      status: 'SUCCESS',
    });
    expect(candidateCreateArg.data).toMatchObject({
      generationRecordId: 101,
      content: '生成结果',
      applyStatus: 'PENDING',
    });
  });

  it('uses one-off AI override config without updating project config', async () => {
    const invoke = jest.fn().mockResolvedValue('覆盖配置生成结果');
    const pipe = jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) });
    const model = {};
    const aiService = {
      getConfiguredStreamingModel: jest.fn().mockReturnValue(model),
    };
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          title: '第一章',
          manuscriptId: 3,
          volumeId: null,
          sortOrder: new Prisma.Decimal('1.00000'),
          content: { content: '已有内容', version: 4 },
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
            outlineId: null,
          },
          volume: null,
        }),
        findMany: jest.fn(),
      },
      manuscripts: {
        findFirst: jest.fn().mockResolvedValue({
          id: 3,
          projectId: 9,
          characters: [],
          systems: [],
          worlds: [],
          misc: [],
          volumes: [],
          chapters: [],
        }),
      },
      projects: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          userId: 100,
          characters: [],
          systems: [],
          worlds: [],
          misc: [],
          aiConfig: {
            provider: 'moonshot',
            model: 'moonshot-v1-32k',
            temperature: new Prisma.Decimal('0.40'),
            maxTokens: 4096,
            enableCharacterContext: true,
            enableSystemContext: true,
            enableWorldContext: true,
            enableMiscContext: true,
            enableChapterSummaryContext: false,
            enableProjectMemoryContext: false,
            contextLengthStrategy: 'BALANCED',
            resultApplyStrategy: 'CANDIDATE',
            defaultContinuePresetId: 301,
            defaultPolishPresetId: null,
            defaultExpandPresetId: null,
            asyncTaskThreshold: 3000,
          },
        }),
      },
      ai_prompt_presets: {
        findFirst: jest.fn().mockResolvedValue({
          id: 401,
          latestVersion: 1,
          versions: [
            {
              version: 1,
              systemPrompt: '覆盖预设：{{settingsContext}}',
              userPromptTemplate: '覆盖模板：{{customPrompt}}',
              outputFormat: 'TEXT',
              parameterSchema: null,
              notes: null,
            },
          ],
        }),
      },
      character_settings: { findMany: jest.fn().mockResolvedValue([]) },
      system_settings: { findMany: jest.fn().mockResolvedValue([]) },
      world_settings: { findMany: jest.fn().mockResolvedValue([]) },
      misc_settings: { findMany: jest.fn().mockResolvedValue([]) },
      ai_generation_records: {
        create: jest.fn((args: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 102,
            jobId: null,
            projectId: 9,
            taskType: args.data.taskType,
            provider: args.data.provider,
            model: args.data.model,
            presetId: args.data.presetId,
            presetVersion: args.data.presetVersion,
            requestPayload: args.data.requestPayload,
            contextSnapshot: args.data.contextSnapshot,
            outputText: '覆盖配置生成结果',
            tokenUsage: null,
            latencyMs: 80,
            status: 'SUCCESS',
            errorMessage: null,
            createdAt: new Date('2026-06-26T01:00:00.000Z'),
          })
        ),
      },
      ai_generation_candidates: {
        create: jest.fn((args: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 203,
            generationRecordId: args.data.generationRecordId,
            projectId: 9,
            outlineId: null,
            manuscriptId: 3,
            chapterId: 7,
            candidateType: 'TEXT',
            targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
            targetId: 7,
            targetContentVersion: 4,
            expectedContentHash: null,
            content: '覆盖配置生成结果',
            diffMeta: null,
            applyStatus: 'PENDING',
            appliedBy: null,
            appliedAt: null,
            applyMode: null,
            appliedContentVersion: null,
            createdAt: new Date('2026-06-26T01:00:00.000Z'),
          })
        ),
      },
      project_ai_configs: {
        update: jest.fn(),
        upsert: jest.fn(),
      },
    };
    const fromMessagesSpy = jest
      .spyOn(ChatPromptTemplate, 'fromMessages')
      .mockReturnValue({ pipe } as never);
    const service = createService(prisma, aiService);

    const response = await service.continueChapter(7, 100, '使用覆盖参数', {
      provider: 'openai',
      model: 'gpt-5.2',
      temperature: 0.9,
      maxTokens: 1234,
      contextLengthStrategy: 'COMPACT',
      defaultPresetId: 401,
    });

    expect(response.effectiveConfig).toMatchObject({
      provider: 'openai',
      model: 'gpt-5.2',
      temperature: 0.9,
      maxTokens: 1234,
      contextLengthStrategy: 'COMPACT',
      defaultPresetId: 401,
    });
    expect(aiService.getConfiguredStreamingModel).toHaveBeenCalledWith({
      provider: 'openai',
      model: 'gpt-5.2',
      temperature: 0.9,
      maxTokens: 1234,
    });
    const presetFindFirst = prisma.ai_prompt_presets.findFirst as jest.MockedFunction<
      (args: { where: Record<string, unknown> }) => Promise<unknown>
    >;
    const presetFindFirstArg = presetFindFirst.mock.calls[0]?.[0];
    expect(presetFindFirstArg?.where).toMatchObject({
      id: 401,
      taskType: 'MANUSCRIPT_CONTINUE',
      OR: [
        { scope: 'SYSTEM' },
        { scope: 'USER', createdBy: 100 },
        { scope: 'PROJECT', projectId: 9 },
      ],
    });
    const generationCreate = prisma.ai_generation_records.create as jest.MockedFunction<
      (args: { data: Record<string, unknown> }) => Promise<unknown>
    >;
    const generationCreateArg = generationCreate.mock.calls[0]?.[0];
    expect(generationCreateArg.data).toMatchObject({
      provider: 'openai',
      model: 'gpt-5.2',
      presetId: 401,
      presetVersion: 1,
      requestPayload: {
        customPrompt: '使用覆盖参数',
        sourceTextLength: null,
        overrideConfig: {
          provider: 'openai',
          model: 'gpt-5.2',
          temperature: 0.9,
          maxTokens: 1234,
          contextLengthStrategy: 'COMPACT',
          defaultPresetId: 401,
        },
      },
    });
    expect(prisma.project_ai_configs.update).not.toHaveBeenCalled();
    expect(prisma.project_ai_configs.upsert).not.toHaveBeenCalled();
    expect(fromMessagesSpy).toHaveBeenCalledWith([
      ['system', expect.stringContaining('覆盖预设：')],
      ['human', expect.stringContaining('覆盖模板：')],
    ]);
  });

  it('schedules a draft chapter without publishing it immediately', async () => {
    const scheduledAt = new Date('2026-07-01T12:00:00.000Z');
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 11,
          manuscript: { id: 5, userId: 100 },
          volume: null,
        }),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $executeRaw: jest.fn(),
          manuscript_chapter: {
            findUnique: jest.fn().mockResolvedValue({
              id: 11,
              manuscript: { id: 5, userId: 100 },
              volume: null,
            }),
            update: jest.fn().mockResolvedValue({
              id: 11,
              status: 'SCHEDULED',
              scheduledAt,
              publishedAt: null,
            }),
          },
          manuscripts: {
            findUnique: jest.fn().mockResolvedValue({
              id: 5,
              chapters: [],
              volumes: [],
            }),
            update: jest.fn(),
          },
          manuscript_volume: { update: jest.fn() },
        };

        return callback(tx);
      }),
    };
    const service = createService(prisma);

    await expect(service.scheduleChapterPublish(11, 100, scheduledAt)).resolves.toMatchObject({
      status: 'SCHEDULED',
      scheduledAt,
      publishedAt: null,
    });
  });

  it('queues a chapter summary job after saving content when summary context is enabled', async () => {
    const tx = {
      $executeRaw: jest.fn(),
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscriptId: 3,
          volumeId: null,
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
          content: {
            id: 77,
            chapterId: 7,
            content: '旧正文',
            version: 1,
          },
        }),
        update: jest.fn(),
      },
      manuscript_chapter_content_version: {
        create: jest.fn(),
      },
      manuscript_chapter_content: {
        update: jest.fn(),
      },
      manuscripts: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          chapters: [{ wordCount: 12, status: 'DRAFT' }],
          volumes: [],
        }),
      },
      manuscript_volume: {
        update: jest.fn(),
      },
    };
    const prisma = {
      manuscript_chapter: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 7,
            manuscriptId: 3,
            volumeId: null,
            manuscript: {
              id: 3,
              userId: 100,
              projectId: 9,
            },
            volume: null,
            content: {
              id: 77,
              chapterId: 7,
              content: '旧正文',
              version: 1,
            },
          })
          .mockResolvedValueOnce({
            id: 7,
            manuscriptId: 3,
            volumeId: null,
            manuscript: {
              id: 3,
              userId: 100,
              projectId: 9,
            },
            volume: null,
            content: {
              id: 77,
              chapterId: 7,
              content: '新正文用于生成摘要',
              version: 2,
              createdAt: new Date('2026-06-26T10:00:00.000Z'),
              updatedAt: new Date('2026-06-26T10:05:00.000Z'),
            },
          })
          .mockResolvedValueOnce({
            id: 7,
            manuscriptId: 3,
            volumeId: null,
            manuscript: {
              id: 3,
              userId: 100,
              projectId: 9,
            },
            volume: null,
            content: {
              id: 77,
              chapterId: 7,
              content: '新正文用于生成摘要',
              version: 2,
            },
          }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
      projects: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          userId: 100,
          aiConfig: {
            enableChapterSummaryContext: true,
          },
        }),
      },
      chapter_summaries: {
        findUnique: jest.fn().mockResolvedValue({
          sourceVersion: 1,
        }),
      },
      ai_jobs: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const aiJobsService = {
      createJob: jest.fn().mockResolvedValue({
        id: 601,
        taskType: 'CHAPTER_SUMMARIZE',
        status: 'QUEUED',
      }),
    };
    const service = createService(prisma, undefined, aiJobsService);

    await expect(
      service.saveChapterContent(7, { content: '新正文用于生成摘要' }, 100)
    ).resolves.toMatchObject({
      content: '新正文用于生成摘要',
      version: 2,
    });
    expect(aiJobsService.createJob).toHaveBeenCalledWith(100, {
      taskType: 'CHAPTER_SUMMARIZE',
      projectId: 9,
      manuscriptId: 3,
      chapterId: 7,
      priority: -1,
      inputPayload: {
        sourceVersion: 2,
      },
      contextMeta: {
        trigger: 'CONTENT_SAVED',
      },
    });
  });

  it('queues a chapter summary job after publishing when summary context is enabled', async () => {
    const tx = {
      $executeRaw: jest.fn(),
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          publishedAt: null,
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
        }),
        update: jest.fn().mockResolvedValue({
          id: 7,
          status: 'PUBLISHED',
          publishedAt: new Date('2026-06-26T10:30:00.000Z'),
          scheduledAt: null,
        }),
      },
      manuscripts: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          chapters: [{ wordCount: 12, status: 'PUBLISHED' }],
          volumes: [],
        }),
        update: jest.fn(),
      },
      manuscript_volume: {
        update: jest.fn(),
      },
    };
    const prisma = {
      manuscript_chapter: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 7,
            manuscript: {
              id: 3,
              userId: 100,
              projectId: 9,
            },
            volume: null,
          })
          .mockResolvedValueOnce({
            id: 7,
            manuscriptId: 3,
            volumeId: null,
            manuscript: {
              id: 3,
              userId: 100,
              projectId: 9,
            },
            volume: null,
            content: {
              id: 77,
              chapterId: 7,
              content: '已发布章节正文',
              version: 3,
            },
          }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
      projects: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          userId: 100,
          aiConfig: {
            enableChapterSummaryContext: true,
          },
        }),
      },
      chapter_summaries: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      ai_jobs: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const aiJobsService = {
      createJob: jest.fn().mockResolvedValue({
        id: 602,
        taskType: 'CHAPTER_SUMMARIZE',
        status: 'QUEUED',
      }),
    };
    const service = createService(prisma, undefined, aiJobsService);

    await expect(service.publishChapter(7, 100)).resolves.toMatchObject({
      status: 'PUBLISHED',
    });
    expect(aiJobsService.createJob).toHaveBeenCalledWith(100, {
      taskType: 'CHAPTER_SUMMARIZE',
      projectId: 9,
      manuscriptId: 3,
      chapterId: 7,
      priority: -1,
      inputPayload: {
        sourceVersion: 3,
      },
      contextMeta: {
        trigger: 'PUBLISHED',
      },
    });
  });

  it('applies a pending AI candidate by appending content to the target chapter', async () => {
    const appliedAt = new Date('2026-06-26T01:00:00.000Z');
    jest.useFakeTimers().setSystemTime(appliedAt);

    const tx = {
      $executeRaw: jest.fn(),
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 202,
          generationRecordId: 101,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '生成结果',
          diffMeta: null,
          applyStatus: 'PENDING',
          appliedBy: null,
          appliedAt: null,
          applyMode: null,
          appliedContentVersion: null,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue({
          id: 202,
          generationRecordId: 101,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '生成结果',
          diffMeta: null,
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'INSERT_TAIL',
          appliedContentVersion: 2,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
      },
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
          },
          volume: null,
          content: {
            id: 77,
            chapterId: 7,
            content: '已有内容',
            version: 1,
          },
        }),
        update: jest.fn(),
      },
      manuscript_chapter_content_version: {
        create: jest.fn(),
      },
      manuscript_chapter_content: {
        update: jest.fn(),
      },
      manuscripts: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          chapters: [{ wordCount: 8, status: 'DRAFT' }],
          volumes: [],
        }),
        update: jest.fn(),
      },
      manuscript_volume: {
        update: jest.fn(),
      },
    };
    const prisma = {
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 202,
          manuscriptId: 3,
          chapterId: 7,
        }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    };
    const service = createService(prisma);

    try {
      await expect(
        service.applyAiCandidate(202, 100, { mode: 'INSERT_TAIL' })
      ).resolves.toMatchObject({
        applyStatus: 'APPLIED',
        appliedBy: 100,
        applyMode: 'INSERT_TAIL',
        appliedContentVersion: 2,
      });

      expect(tx.manuscript_chapter_content_version.create).toHaveBeenCalledWith({
        data: {
          contentId: 77,
          version: 1,
          content: '已有内容',
        },
      });
      expect(tx.manuscript_chapter_content.update).toHaveBeenCalledWith({
        where: { chapterId: 7 },
        data: {
          content: '已有内容\n\n生成结果',
          version: 2,
        },
      });
      expect(tx.ai_generation_candidates.update).toHaveBeenCalledWith({
        where: { id: 202 },
        data: {
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'INSERT_TAIL',
          appliedContentVersion: 2,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('applies a pending AI candidate by overwriting the target chapter draft', async () => {
    const appliedAt = new Date('2026-06-26T01:30:00.000Z');
    jest.useFakeTimers().setSystemTime(appliedAt);

    const tx = {
      $executeRaw: jest.fn(),
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 203,
          generationRecordId: 102,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '润色后的正文',
          diffMeta: null,
          applyStatus: 'PENDING',
          appliedBy: null,
          appliedAt: null,
          applyMode: null,
          appliedContentVersion: null,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue({
          id: 203,
          generationRecordId: 102,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '润色后的正文',
          diffMeta: null,
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'OVERWRITE_DRAFT',
          appliedContentVersion: 2,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
      },
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
          },
          volume: null,
          content: {
            id: 77,
            chapterId: 7,
            content: '已有内容',
            version: 1,
          },
        }),
        update: jest.fn(),
      },
      manuscript_chapter_content_version: {
        create: jest.fn(),
      },
      manuscript_chapter_content: {
        update: jest.fn(),
      },
      manuscripts: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          chapters: [{ wordCount: 5, status: 'DRAFT' }],
          volumes: [],
        }),
        update: jest.fn(),
      },
      manuscript_volume: {
        update: jest.fn(),
      },
    };
    const prisma = {
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 203,
          manuscriptId: 3,
          chapterId: 7,
        }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    };
    const service = createService(prisma);

    try {
      await expect(
        service.applyAiCandidate(203, 100, { mode: 'OVERWRITE_DRAFT' })
      ).resolves.toMatchObject({
        applyStatus: 'APPLIED',
        appliedBy: 100,
        applyMode: 'OVERWRITE_DRAFT',
        appliedContentVersion: 2,
      });

      expect(tx.manuscript_chapter_content_version.create).toHaveBeenCalledWith({
        data: {
          contentId: 77,
          version: 1,
          content: '已有内容',
        },
      });
      expect(tx.manuscript_chapter_content.update).toHaveBeenCalledWith({
        where: { chapterId: 7 },
        data: {
          content: '润色后的正文',
          version: 2,
        },
      });
      expect(tx.ai_generation_candidates.update).toHaveBeenCalledWith({
        where: { id: 203 },
        data: {
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'OVERWRITE_DRAFT',
          appliedContentVersion: 2,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('applies a pending AI candidate by saving it as the target chapter draft', async () => {
    const appliedAt = new Date('2026-06-26T02:00:00.000Z');
    jest.useFakeTimers().setSystemTime(appliedAt);

    const tx = {
      $executeRaw: jest.fn(),
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 204,
          generationRecordId: 103,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '暂存为草稿的正文',
          diffMeta: null,
          applyStatus: 'PENDING',
          appliedBy: null,
          appliedAt: null,
          applyMode: null,
          appliedContentVersion: null,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue({
          id: 204,
          generationRecordId: 103,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '暂存为草稿的正文',
          diffMeta: null,
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'SAVE_AS_DRAFT',
          appliedContentVersion: 2,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
      },
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
          },
          volume: null,
          content: {
            id: 77,
            chapterId: 7,
            content: '已有内容',
            version: 1,
          },
        }),
        update: jest.fn(),
      },
      manuscript_chapter_content_version: {
        create: jest.fn(),
      },
      manuscript_chapter_content: {
        update: jest.fn(),
      },
      manuscripts: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          chapters: [{ wordCount: 8, status: 'DRAFT' }],
          volumes: [],
        }),
        update: jest.fn(),
      },
      manuscript_volume: {
        update: jest.fn(),
      },
    };
    const prisma = {
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 204,
          manuscriptId: 3,
          chapterId: 7,
        }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    };
    const service = createService(prisma);

    try {
      await expect(
        service.applyAiCandidate(204, 100, { mode: 'SAVE_AS_DRAFT' })
      ).resolves.toMatchObject({
        applyStatus: 'APPLIED',
        appliedBy: 100,
        applyMode: 'SAVE_AS_DRAFT',
        appliedContentVersion: 2,
      });

      expect(tx.manuscript_chapter_content_version.create).toHaveBeenCalledWith({
        data: {
          contentId: 77,
          version: 1,
          content: '已有内容',
        },
      });
      expect(tx.manuscript_chapter_content.update).toHaveBeenCalledWith({
        where: { chapterId: 7 },
        data: {
          content: '暂存为草稿的正文',
          version: 2,
        },
      });
      expect(tx.ai_generation_candidates.update).toHaveBeenCalledWith({
        where: { id: 204 },
        data: {
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'SAVE_AS_DRAFT',
          appliedContentVersion: 2,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('applies a pending AI candidate by replacing the selected chapter text', async () => {
    const appliedAt = new Date('2026-06-26T02:30:00.000Z');
    jest.useFakeTimers().setSystemTime(appliedAt);

    const tx = {
      $executeRaw: jest.fn(),
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 205,
          generationRecordId: 104,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '润色后的片段',
          diffMeta: null,
          applyStatus: 'PENDING',
          appliedBy: null,
          appliedAt: null,
          applyMode: null,
          appliedContentVersion: null,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
        update: jest.fn().mockResolvedValue({
          id: 205,
          generationRecordId: 104,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 1,
          expectedContentHash: null,
          content: '润色后的片段',
          diffMeta: null,
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'REPLACE_SELECTION',
          appliedContentVersion: 2,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
      },
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
          },
          volume: null,
          content: {
            id: 77,
            chapterId: 7,
            content: '开头\n待润色片段\n结尾',
            version: 1,
          },
        }),
        update: jest.fn(),
      },
      manuscript_chapter_content_version: {
        create: jest.fn(),
      },
      manuscript_chapter_content: {
        update: jest.fn(),
      },
      manuscripts: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          chapters: [{ wordCount: 10, status: 'DRAFT' }],
          volumes: [],
        }),
        update: jest.fn(),
      },
      manuscript_volume: {
        update: jest.fn(),
      },
    };
    const prisma = {
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 205,
          manuscriptId: 3,
          chapterId: 7,
        }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    };
    const service = createService(prisma);

    try {
      await expect(
        service.applyAiCandidate(205, 100, {
          mode: 'REPLACE_SELECTION',
          selectedText: '待润色片段',
        })
      ).resolves.toMatchObject({
        applyStatus: 'APPLIED',
        appliedBy: 100,
        applyMode: 'REPLACE_SELECTION',
        appliedContentVersion: 2,
      });

      expect(tx.manuscript_chapter_content_version.create).toHaveBeenCalledWith({
        data: {
          contentId: 77,
          version: 1,
          content: '开头\n待润色片段\n结尾',
        },
      });
      expect(tx.manuscript_chapter_content.update).toHaveBeenCalledWith({
        where: { chapterId: 7 },
        data: {
          content: '开头\n润色后的片段\n结尾',
          version: 2,
        },
      });
      expect(tx.ai_generation_candidates.update).toHaveBeenCalledWith({
        where: { id: 205 },
        data: {
          applyStatus: 'APPLIED',
          appliedBy: 100,
          appliedAt,
          applyMode: 'REPLACE_SELECTION',
          appliedContentVersion: 2,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects applying an AI candidate when the chapter content version changed', async () => {
    const tx = {
      $executeRaw: jest.fn(),
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 202,
          manuscriptId: 3,
          chapterId: 7,
          targetContentVersion: 1,
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          content: '生成结果',
          applyStatus: 'PENDING',
        }),
      },
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
          },
          volume: null,
          content: {
            id: 77,
            chapterId: 7,
            content: '已有内容已变化',
            version: 2,
          },
        }),
      },
    };
    const prisma = {
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 202,
          manuscriptId: 3,
          chapterId: 7,
        }),
      },
      $transaction: jest.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
        callback(tx)
      ),
    };
    const service = createService(prisma);

    await expect(service.applyAiCandidate(202, 100, { mode: 'INSERT_TAIL' })).rejects.toThrow(
      '章节内容已变化，请重新生成候选'
    );
  });

  it('discards a pending AI candidate after verifying chapter ownership', async () => {
    const discardedAt = new Date('2026-06-26T02:00:00.000Z');
    jest.useFakeTimers().setSystemTime(discardedAt);

    const prisma = {
      ai_generation_candidates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 206,
          manuscriptId: 3,
          chapterId: 7,
          applyStatus: 'PENDING',
        }),
        update: jest.fn().mockResolvedValue({
          id: 206,
          generationRecordId: 106,
          projectId: 9,
          outlineId: null,
          manuscriptId: 3,
          chapterId: 7,
          candidateType: 'TEXT',
          targetType: 'MANUSCRIPT_CHAPTER_CONTENT',
          targetId: 7,
          targetContentVersion: 2,
          expectedContentHash: null,
          content: '不采用的候选',
          diffMeta: null,
          applyStatus: 'DISCARDED',
          appliedBy: 100,
          appliedAt: discardedAt,
          applyMode: null,
          appliedContentVersion: null,
          createdAt: new Date('2026-06-26T00:00:00.000Z'),
        }),
      },
      manuscripts: {
        findFirst: jest.fn().mockResolvedValue({
          id: 3,
        }),
      },
    };
    const service = createService(prisma);

    try {
      await expect(service.discardAiCandidate(206, 100)).resolves.toMatchObject({
        id: 206,
        applyStatus: 'DISCARDED',
        appliedBy: 100,
        appliedAt: discardedAt.toISOString(),
      });
      expect(prisma.ai_generation_candidates.update).toHaveBeenCalledWith({
        where: { id: 206 },
        data: {
          applyStatus: 'DISCARDED',
          appliedBy: 100,
          appliedAt: discardedAt,
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('gets a chapter summary after verifying chapter ownership', async () => {
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
          content: null,
        }),
      },
      chapter_summaries: {
        findUnique: jest.fn().mockResolvedValue({
          id: 301,
          chapterId: 7,
          projectId: 9,
          summary: '主角完成入门试炼。',
          summaryType: 'MANUAL',
          sourceVersion: 2,
          generatedBy: 100,
          createdAt: new Date('2026-06-26T09:00:00.000Z'),
          updatedAt: new Date('2026-06-26T09:00:00.000Z'),
        }),
      },
    };
    const service = createService(prisma);

    await expect(service.getChapterSummary(7, 100)).resolves.toMatchObject({
      id: 301,
      chapterId: 7,
      summary: '主角完成入门试炼。',
      summaryType: 'MANUAL',
    });
    expect(prisma.chapter_summaries.findUnique).toHaveBeenCalledWith({
      where: { chapterId: 7 },
    });
  });

  it('saves a chapter summary with the current content version', async () => {
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
          content: {
            version: 4,
          },
        }),
      },
      chapter_summaries: {
        upsert: jest.fn().mockResolvedValue({
          id: 302,
          chapterId: 7,
          projectId: 9,
          summary: '主角发现宗门试炼隐藏线索。',
          summaryType: 'MANUAL',
          sourceVersion: 4,
          generatedBy: 100,
          createdAt: new Date('2026-06-26T09:10:00.000Z'),
          updatedAt: new Date('2026-06-26T09:10:00.000Z'),
        }),
      },
    };
    const service = createService(prisma);

    await expect(
      service.saveChapterSummary(
        7,
        {
          summary: '主角发现宗门试炼隐藏线索。',
        },
        100
      )
    ).resolves.toMatchObject({
      id: 302,
      chapterId: 7,
      summary: '主角发现宗门试炼隐藏线索。',
      sourceVersion: 4,
    });
    expect(prisma.chapter_summaries.upsert).toHaveBeenCalledWith({
      where: { chapterId: 7 },
      create: {
        chapterId: 7,
        projectId: 9,
        summary: '主角发现宗门试炼隐藏线索。',
        summaryType: 'MANUAL',
        sourceVersion: 4,
        generatedBy: 100,
      },
      update: {
        projectId: 9,
        summary: '主角发现宗门试炼隐藏线索。',
        summaryType: 'MANUAL',
        sourceVersion: 4,
        generatedBy: 100,
      },
    });
  });

  it('creates a chapter summary AI job after verifying chapter ownership and content', async () => {
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          manuscriptId: 3,
          volumeId: null,
          sortOrder: new Prisma.Decimal('2.00000'),
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
          content: {
            content: '主角进入宗门试炼，破解机关后发现师兄一直在暗中观察。',
            version: 4,
          },
        }),
      },
    };
    const aiJobsService = {
      createJob: jest.fn().mockResolvedValue({
        id: 501,
        taskType: 'CHAPTER_SUMMARIZE',
        status: 'QUEUED',
        chapterId: 7,
      }),
    };
    const service = createService(prisma, undefined, aiJobsService);

    await expect(service.createChapterSummaryJob(7, 100)).resolves.toMatchObject({
      id: 501,
      taskType: 'CHAPTER_SUMMARIZE',
      status: 'QUEUED',
      chapterId: 7,
    });
    expect(aiJobsService.createJob).toHaveBeenCalledWith(100, {
      taskType: 'CHAPTER_SUMMARIZE',
      projectId: 9,
      manuscriptId: 3,
      chapterId: 7,
      priority: 0,
      inputPayload: {
        sourceVersion: 4,
      },
      contextMeta: {
        trigger: 'MANUAL',
      },
    });
  });

  it('processes a chapter summary job and writes generated summary', async () => {
    const invoke = jest.fn().mockResolvedValue('主角完成宗门试炼，并发现师兄试探。');
    const pipe = jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) });
    const model = {};
    const aiService = {
      getConfiguredStreamingModel: jest.fn().mockReturnValue(model),
    };
    const prisma = {
      manuscript_chapter: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          title: '试炼',
          manuscriptId: 3,
          volumeId: null,
          sortOrder: new Prisma.Decimal('2.00000'),
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
          content: {
            content: '主角进入宗门试炼，破解机关后发现师兄一直在暗中观察。',
            version: 4,
          },
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      projects: {
        findFirst: jest.fn().mockResolvedValue({
          id: 9,
          userId: 100,
          characters: [],
          systems: [],
          worlds: [],
          misc: [],
          aiConfig: {
            provider: 'moonshot',
            model: 'moonshot-v1-32k',
            temperature: new Prisma.Decimal('0.40'),
            maxTokens: 4096,
            enableCharacterContext: false,
            enableSystemContext: false,
            enableWorldContext: false,
            enableMiscContext: false,
            enableChapterSummaryContext: false,
            enableProjectMemoryContext: false,
            contextLengthStrategy: 'BALANCED',
            resultApplyStrategy: 'CANDIDATE',
            defaultContinuePresetId: null,
            defaultPolishPresetId: null,
            defaultExpandPresetId: null,
          },
        }),
      },
      character_settings: {
        findMany: jest.fn(),
      },
      system_settings: {
        findMany: jest.fn(),
      },
      world_settings: {
        findMany: jest.fn(),
      },
      misc_settings: {
        findMany: jest.fn(),
      },
      ai_prompt_presets: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      chapter_summaries: {
        upsert: jest.fn().mockResolvedValue({
          id: 303,
          chapterId: 7,
          projectId: 9,
          summary: '主角完成宗门试炼，并发现师兄试探。',
          summaryType: 'AI',
          sourceVersion: 4,
          generatedBy: 100,
          createdAt: new Date('2026-06-26T09:30:00.000Z'),
          updatedAt: new Date('2026-06-26T09:30:00.000Z'),
        }),
      },
    };
    jest.spyOn(ChatPromptTemplate, 'fromMessages').mockReturnValue({ pipe } as never);
    const service = createService(prisma, aiService);

    await expect(
      service.processChapterSummarizeJob({
        userId: 100,
        chapterId: 7,
      })
    ).resolves.toEqual({
      chapterId: 7,
      summaryLength: 17,
    });
    expect(prisma.chapter_summaries.upsert).toHaveBeenCalledWith({
      where: { chapterId: 7 },
      create: {
        chapterId: 7,
        projectId: 9,
        summary: '主角完成宗门试炼，并发现师兄试探。',
        summaryType: 'AI',
        sourceVersion: 4,
        generatedBy: 100,
      },
      update: {
        projectId: 9,
        summary: '主角完成宗门试炼，并发现师兄试探。',
        summaryType: 'AI',
        sourceVersion: 4,
        generatedBy: 100,
      },
    });
  });
});
