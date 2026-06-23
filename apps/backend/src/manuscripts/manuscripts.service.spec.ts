import { Prisma } from '../../generated/prisma';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { PrismaService } from '../prisma/prisma.service';
import type { AIService } from '../ai/ai.service';
import { ManuscriptsService } from './manuscripts.service';

describe('ManuscriptsService project AI config and scheduling', () => {
  function createService(prisma: unknown, aiService?: Partial<AIService>) {
    return new ManuscriptsService(
      prisma as PrismaService,
      {
        getConfiguredStreamingModel: jest.fn(),
        getDefaultStreamingModel: jest.fn(),
        ...aiService,
      } as unknown as AIService
    );
  }

  it('uses project AI config to choose model and filter context sources', async () => {
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
          content: { content: '已有内容' },
          manuscript: {
            id: 3,
            userId: 100,
            projectId: 9,
          },
          volume: null,
        }),
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
            contextLengthStrategy: 'COMPACT',
            resultApplyStrategy: 'CANDIDATE',
            asyncTaskThreshold: 3000,
          },
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
    };
    jest.spyOn(ChatPromptTemplate, 'fromMessages').mockReturnValue({ pipe } as never);

    const service = createService(prisma, aiService);

    await expect(service.continueChapter(7, 100)).resolves.toBe('生成结果');

    expect(aiService.getConfiguredStreamingModel).toHaveBeenCalledWith({
      provider: 'moonshot',
      model: 'moonshot-v1-32k',
      temperature: 0.4,
      maxTokens: 4096,
    });
    expect(prisma.system_settings.findMany).not.toHaveBeenCalled();
    expect(prisma.misc_settings.findMany).not.toHaveBeenCalled();
    expect(pipe).toHaveBeenCalledWith(model);
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
});
