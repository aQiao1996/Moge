import { WorkspaceService } from './workspace.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma';

interface MockPrismaService extends PrismaService {
  misc_settings: PrismaService['misc_settings'] & {
    findFirst: jest.Mock<Promise<WorkspaceRecord | null>, []>;
    create: jest.Mock<Promise<WorkspaceRecord>, [CreateWorkspaceRecordArgs]>;
    update: jest.Mock<Promise<WorkspaceRecord>, [UpdateWorkspaceRecordArgs]>;
  };
  manuscript_chapter_content: PrismaService['manuscript_chapter_content'] & {
    findMany: jest.Mock<Promise<[]>, []>;
  };
  manuscript_chapter_content_version: PrismaService['manuscript_chapter_content_version'] & {
    findMany: jest.Mock<Promise<[]>, []>;
  };
  projects: PrismaService['projects'] & {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  outline: PrismaService['outline'] & {
    findMany: jest.Mock;
  };
  manuscripts: PrismaService['manuscripts'] & {
    findMany: jest.Mock;
    aggregate: jest.Mock;
    count: jest.Mock;
  };
  ai_generation_records: PrismaService['ai_generation_records'] & {
    findMany: jest.Mock;
    count: jest.Mock;
    aggregate: jest.Mock;
  };
  ai_generation_candidates: PrismaService['ai_generation_candidates'] & {
    count: jest.Mock;
  };
}

interface WorkspaceRecord {
  id: number;
  userId: number;
  name: string;
  type: string;
  notes: Prisma.JsonValue | null;
  inspirations: Prisma.JsonValue | null;
}

interface CreateWorkspaceRecordArgs {
  data: {
    userId: number;
    name: string;
    type: string;
    notes?: Prisma.JsonValue | null;
    inspirations?: Prisma.JsonValue | null;
  };
}

interface UpdateWorkspaceRecordArgs {
  data: {
    notes?: Prisma.JsonValue | null;
    inspirations?: Prisma.JsonValue | null;
  };
}

describe('WorkspaceService', () => {
  const userId = 9;
  let prisma: MockPrismaService;
  let service: WorkspaceService;
  let workspaceRecord: WorkspaceRecord;

  beforeEach(() => {
    workspaceRecord = {
      id: 17,
      userId,
      name: '__moge_workspace__',
      type: 'workspace_private',
      notes: [],
      inspirations: [],
    };

    prisma = {
      misc_settings: {
        findFirst: jest.fn(() => Promise.resolve(workspaceRecord)),
        create: jest.fn((args: CreateWorkspaceRecordArgs) => {
          workspaceRecord = {
            id: 17,
            userId: args.data.userId,
            name: args.data.name,
            type: args.data.type,
            notes: args.data.notes ?? [],
            inspirations: args.data.inspirations ?? [],
          };
          return Promise.resolve(workspaceRecord);
        }),
        update: jest.fn((args: UpdateWorkspaceRecordArgs) => {
          workspaceRecord = {
            ...workspaceRecord,
            notes: args.data.notes ?? workspaceRecord.notes,
            inspirations: args.data.inspirations ?? workspaceRecord.inspirations,
          };
          return Promise.resolve(workspaceRecord);
        }),
      },
      manuscript_chapter_content: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
      manuscript_chapter_content_version: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
      projects: {
        findMany: jest.fn((args?: { select?: { id?: boolean; name?: boolean } }) => {
          if (args?.select?.name) {
            return Promise.resolve([{ id: 12, name: '长夜项目' }]);
          }

          return Promise.resolve([]);
        }),
        count: jest.fn(() => Promise.resolve(0)),
      },
      outline: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
      manuscripts: {
        findMany: jest.fn(() => Promise.resolve([])),
        aggregate: jest.fn(() => Promise.resolve({ _sum: { totalWords: 0 } })),
        count: jest.fn(() => Promise.resolve(0)),
      },
      ai_generation_records: {
        findMany: jest.fn(() =>
          Promise.resolve([
            {
              id: 31,
              projectId: 12,
              taskType: 'MANUSCRIPT_CONTINUE',
              provider: 'moonshot',
              model: 'moonshot-v1-32k',
              status: 'SUCCESS',
              latencyMs: 1200,
              createdAt: new Date('2026-06-26T01:00:00.000Z'),
            },
          ])
        ),
        count: jest.fn((args?: { where?: { status?: string } }) =>
          Promise.resolve(args?.where?.status === 'FAILED' ? 1 : 4)
        ),
        aggregate: jest.fn(() => Promise.resolve({ _avg: { latencyMs: 900 } })),
      },
      ai_generation_candidates: {
        count: jest.fn((args?: { where?: { applyStatus?: string } }) =>
          Promise.resolve(args?.where?.applyStatus === 'APPLIED' ? 2 : 5)
        ),
      },
    } as unknown as MockPrismaService;

    service = new WorkspaceService(prisma);
  });

  it('creates an internal misc record when workspace storage is missing', async () => {
    prisma.misc_settings.findFirst.mockResolvedValueOnce(null);

    const items = await service.getWorkspaceItems(userId);

    expect(items).toEqual({ todos: [], ideas: [] });
    expect(prisma.misc_settings.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.misc_settings.create.mock.calls[0]?.[0];
    expect(createArgs?.data.userId).toBe(userId);
    expect(createArgs?.data.name).toBe('__moge_workspace__');
    expect(createArgs?.data.type).toBe('workspace_private');
  });

  it('creates, updates, and deletes workspace todos', async () => {
    const todo = await service.createTodo(userId, '写完第三章');
    expect(todo.text).toBe('写完第三章');
    expect(todo.done).toBe(false);

    const updated = await service.updateTodo(userId, todo.id, true);
    expect(updated.todos).toEqual([{ ...todo, done: true }]);

    const deleted = await service.deleteTodo(userId, todo.id);
    expect(deleted.todos).toEqual([]);
  });

  it('creates and deletes workspace ideas', async () => {
    const idea = await service.createIdea(userId, '反派提前登场');
    expect(idea.content).toBe('反派提前登场');

    const deleted = await service.deleteIdea(userId, idea.id);
    expect(deleted.ideas).toEqual([]);
  });

  it('includes AI usage overview in workspace summary', async () => {
    const summary = await service.getWorkspaceSummary(userId);

    expect(summary.aiUsage).toEqual({
      totalCalls: 4,
      successCount: 4,
      failedCount: 1,
      averageLatencyMs: 900,
      candidateCount: 5,
      appliedCandidateCount: 2,
      recentRecords: [
        {
          id: 31,
          projectId: 12,
          projectName: '长夜项目',
          taskType: 'MANUSCRIPT_CONTINUE',
          provider: 'moonshot',
          model: 'moonshot-v1-32k',
          status: 'SUCCESS',
          latencyMs: 1200,
          createdAt: '2026-06-26T01:00:00.000Z',
        },
      ],
    });
    expect(prisma.ai_generation_records.findMany).toHaveBeenCalledWith({
      where: {
        projectId: { in: [12] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        projectId: true,
        taskType: true,
        provider: true,
        model: true,
        status: true,
        latencyMs: true,
        createdAt: true,
      },
    });
  });
});
