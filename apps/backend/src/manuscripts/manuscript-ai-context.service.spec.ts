import { ManuscriptAiContextService } from './manuscript-ai-context.service';
import { Prisma } from '../../generated/prisma';
import type { PrismaService } from '../prisma/prisma.service';

describe('ManuscriptAiContextService', () => {
  it('builds settings context and structured source metadata from manuscript settings', () => {
    const service = new ManuscriptAiContextService();

    const result = service.buildContext({
      characters: [{ id: 1, name: '主角', background: '孤儿' }],
      systems: [{ id: 2, name: '系统', description: '升级' }],
      worlds: [{ id: 3, name: '世界', description: '仙侠' }],
      misc: [{ id: 4, name: '辅助', description: '伏笔' }],
      aiConfig: {
        enableCharacterContext: true,
        enableSystemContext: false,
        enableWorldContext: true,
        enableMiscContext: false,
      },
    });

    expect(result.settingsContext).toContain('## 角色设定');
    expect(result.settingsContext).toContain('- 主角: 孤儿');
    expect(result.settingsContext).toContain('## 世界设定');
    expect(result.contextSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'CHARACTER',
          sourceName: '角色',
          included: true,
          contentPreview: '1 项',
        }),
        expect.objectContaining({
          sourceType: 'SYSTEM',
          sourceName: '系统',
          included: false,
          contentPreview: '1 项',
        }),
        expect.objectContaining({
          sourceType: 'WORLD',
          sourceName: '世界',
          included: true,
          contentPreview: '1 项',
        }),
        expect.objectContaining({
          sourceType: 'MISC',
          sourceName: '辅助',
          included: false,
          contentPreview: '1 项',
        }),
      ])
    );
  });

  it('loads project scoped manuscript context using project AI config switches', async () => {
    const prisma = {
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
      manuscript_chapter: {
        findMany: jest.fn(),
      },
    };
    const service = new ManuscriptAiContextService(prisma as unknown as PrismaService);

    const result = await service.loadManuscriptContext(
      {
        id: 3,
        userId: 100,
        projectId: 9,
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      },
      100
    );

    expect(result.aiConfig).toMatchObject({
      provider: 'moonshot',
      model: 'moonshot-v1-32k',
      temperature: 0.4,
      maxTokens: 4096,
      contextLengthStrategy: 'COMPACT',
      defaultContinuePresetId: 301,
    });
    expect(result.settingsContext).toContain('- 主角: 孤儿');
    expect(result.settingsContext).toContain('- 世界: 仙侠');
    expect(prisma.system_settings.findMany).not.toHaveBeenCalled();
    expect(prisma.misc_settings.findMany).not.toHaveBeenCalled();
    expect(result.contextSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceType: 'CHARACTER', included: true }),
        expect.objectContaining({ sourceType: 'SYSTEM', included: false }),
        expect.objectContaining({ sourceType: 'WORLD', included: true }),
        expect.objectContaining({ sourceType: 'MISC', included: false }),
      ])
    );
    expect(prisma.manuscript_chapter.findMany).not.toHaveBeenCalled();
  });

  it('loads recent previous chapter context when chapter summary context is enabled', async () => {
    const prisma = {
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
            enableChapterSummaryContext: true,
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
      manuscript_chapter: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 12,
            title: '第二章',
            content: { content: '第二章发生了一场试炼，主角获得线索。' },
          },
          {
            id: 11,
            title: '第一章',
            content: { content: '第一章介绍主角进入宗门。' },
          },
        ]),
      },
    };
    const service = new ManuscriptAiContextService(prisma as unknown as PrismaService);

    const result = await service.loadManuscriptContext(
      {
        id: 3,
        userId: 100,
        projectId: 9,
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      },
      100,
      {
        chapterId: 13,
        manuscriptId: 3,
        volumeId: null,
        sortOrder: new Prisma.Decimal('3.00000'),
      }
    );

    expect(prisma.manuscript_chapter.findMany).toHaveBeenCalledWith({
      where: {
        manuscriptId: 3,
        volumeId: null,
        sortOrder: { lt: new Prisma.Decimal('3.00000') },
      },
      include: { content: true, summary: true },
      orderBy: { sortOrder: 'desc' },
      take: 3,
    });
    expect(result.settingsContext).toContain('## 近期章节');
    expect(result.settingsContext).toContain('- 第二章: 第二章发生了一场试炼，主角获得线索。');
    expect(result.contextSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'RECENT_CHAPTER',
          sourceName: '近期章节',
          included: true,
          contentPreview: '2 章',
        }),
      ])
    );
  });

  it('uses chapter summaries before raw chapter previews when summary context is enabled', async () => {
    const prisma = {
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
            enableChapterSummaryContext: true,
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
      manuscript_chapter: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 12,
            title: '第二章',
            content: { content: '第二章正文原文，不应优先出现。' },
            summary: { summary: '第二章摘要：主角获得线索。' },
          },
        ]),
      },
    };
    const service = new ManuscriptAiContextService(prisma as unknown as PrismaService);

    const result = await service.loadManuscriptContext(
      {
        id: 3,
        userId: 100,
        projectId: 9,
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      },
      100,
      {
        chapterId: 13,
        manuscriptId: 3,
        volumeId: null,
        sortOrder: new Prisma.Decimal('3.00000'),
      }
    );

    expect(prisma.manuscript_chapter.findMany).toHaveBeenCalledWith({
      where: {
        manuscriptId: 3,
        volumeId: null,
        sortOrder: { lt: new Prisma.Decimal('3.00000') },
      },
      include: { content: true, summary: true },
      orderBy: { sortOrder: 'desc' },
      take: 3,
    });
    expect(result.settingsContext).toContain('- 第二章: 第二章摘要：主角获得线索。');
    expect(result.settingsContext).not.toContain('第二章正文原文，不应优先出现。');
  });

  it('loads project memory context when project memory context is enabled', async () => {
    const prisma = {
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
            enableProjectMemoryContext: true,
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
      manuscript_chapter: {
        findMany: jest.fn(),
      },
      project_memory_items: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 701,
            category: 'STYLE',
            title: '叙事口吻',
            content: '保持冷静克制的第三人称。',
            priority: 10,
          },
        ]),
      },
    };
    const service = new ManuscriptAiContextService(prisma as unknown as PrismaService);

    const result = await service.loadManuscriptContext(
      {
        id: 3,
        userId: 100,
        projectId: 9,
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      },
      100
    );

    expect(prisma.project_memory_items.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 9,
        status: 'ACTIVE',
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 8,
    });
    expect(result.settingsContext).toContain('## 项目记忆');
    expect(result.settingsContext).toContain('- [STYLE] 叙事口吻: 保持冷静克制的第三人称。');
    expect(result.contextSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'PROJECT_MEMORY',
          sourceName: '项目记忆',
          included: true,
          contentPreview: '1 条',
        }),
      ])
    );
  });

  it('loads project knowledge chunks as expanded project context', async () => {
    const prisma = {
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
            enableProjectMemoryContext: true,
            contextLengthStrategy: 'EXPANDED',
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
      manuscript_chapter: {
        findMany: jest.fn(),
      },
      project_memory_items: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      knowledge_chunks: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 901,
            documentId: 801,
            projectId: 9,
            chunkIndex: 0,
            content: '宗门分内外门，内门弟子可进入藏经阁二层。',
            keywords: ['宗门', '藏经阁'],
            summary: '门派制度摘要',
            document: {
              title: '门派制度',
              documentType: 'NOTE',
            },
          },
        ]),
      },
    };
    const service = new ManuscriptAiContextService(prisma as unknown as PrismaService);

    const result = await service.loadManuscriptContext(
      {
        id: 3,
        userId: 100,
        projectId: 9,
        characters: [],
        systems: [],
        worlds: [],
        misc: [],
      },
      100
    );

    expect(prisma.knowledge_chunks.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 9,
        document: {
          status: 'ACTIVE',
        },
      },
      include: {
        document: {
          select: {
            title: true,
            documentType: true,
          },
        },
      },
      orderBy: [{ documentId: 'desc' }, { chunkIndex: 'asc' }],
      take: 6,
    });
    expect(result.settingsContext).toContain('## 项目资料');
    expect(result.settingsContext).toContain(
      '- [NOTE] 门派制度: 门派制度摘要；宗门分内外门，内门弟子可进入藏经阁二层。'
    );
    expect(result.contextSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'PROJECT_KNOWLEDGE',
          sourceName: '项目资料',
          included: true,
          contentPreview: '1 段',
        }),
      ])
    );
  });
});
