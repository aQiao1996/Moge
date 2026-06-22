import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { DictService } from './dict.service';

interface MockPrismaService extends PrismaService {
  dict_items: PrismaService['dict_items'] & {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    groupBy: jest.Mock;
  };
  dict_item_versions: PrismaService['dict_item_versions'] & {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  projects: PrismaService['projects'] & {
    findFirst: jest.Mock;
  };
  $transaction: jest.Mock;
}

const now = new Date('2026-06-22T08:00:00.000Z');

function createDictItem(overrides: Record<string, unknown>) {
  return {
    id: 1,
    categoryCode: 'novel_types',
    label: '系统玄幻',
    value: 'fantasy',
    description: null,
    sortOrder: 1,
    isEnabled: true,
    scope: 'SYSTEM',
    userId: null,
    projectId: null,
    shareStatus: 'PRIVATE',
    version: 1,
    sourceItemId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createBasePrisma(): MockPrismaService {
  const prisma = {
    dict_items: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    dict_item_versions: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    projects: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: MockPrismaService) => Promise<unknown>) =>
      callback(prisma)
    ),
  } as unknown as MockPrismaService;

  return prisma;
}

describe('DictService', () => {
  const userId = 100;

  it('returns scoped dictionary items with project entries overriding user and system values', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue({ id: 9, userId });
    prisma.dict_items.findMany.mockResolvedValue([
      createDictItem({ id: 1, label: '系统玄幻', value: 'fantasy', scope: 'SYSTEM', sortOrder: 1 }),
      createDictItem({
        id: 2,
        label: '个人玄幻',
        value: 'fantasy',
        scope: 'USER',
        userId,
        sortOrder: 2,
      }),
      createDictItem({
        id: 3,
        label: '项目玄幻',
        value: 'fantasy',
        scope: 'PROJECT',
        userId,
        projectId: 9,
        sortOrder: 3,
      }),
      createDictItem({ id: 4, label: '都市', value: 'urban', scope: 'SYSTEM', sortOrder: 4 }),
    ]);

    const service = new DictService(prisma);

    await expect(service.findByType('novel_types', userId, { projectId: 9 })).resolves.toEqual([
      createDictItem({
        id: 3,
        label: '项目玄幻',
        value: 'fantasy',
        scope: 'PROJECT',
        userId,
        projectId: 9,
        sortOrder: 3,
      }),
      createDictItem({ id: 4, label: '都市', value: 'urban', scope: 'SYSTEM', sortOrder: 4 }),
    ]);

    expect(prisma.projects.findFirst).toHaveBeenCalledWith({
      where: { id: 9, userId },
      select: { id: true },
    });
  });

  it('creates user scoped items by default', async () => {
    const prisma = createBasePrisma();
    prisma.dict_items.findFirst.mockResolvedValue(null);
    prisma.dict_items.create.mockResolvedValue(
      createDictItem({ id: 8, label: '仙侠', value: 'xianxia', scope: 'USER', userId })
    );

    const service = new DictService(prisma);

    await expect(
      service.create(userId, {
        categoryCode: 'novel_types',
        label: '仙侠',
        value: 'xianxia',
      })
    ).resolves.toMatchObject({ id: 8, scope: 'USER', userId, projectId: null });
  });

  it('creates a version snapshot before updating an owned item', async () => {
    const prisma = createBasePrisma();
    const existingItem = createDictItem({
      id: 7,
      label: '旧标签',
      value: 'old_value',
      scope: 'USER',
      userId,
      version: 2,
    });
    prisma.dict_items.findUnique.mockResolvedValue(existingItem);
    prisma.dict_items.findFirst.mockResolvedValue(null);
    prisma.dict_items.update.mockResolvedValue({
      ...existingItem,
      label: '新标签',
      version: 3,
    });

    const service = new DictService(prisma);

    await expect(service.update(userId, 7, { label: '新标签' })).resolves.toMatchObject({
      id: 7,
      label: '新标签',
      version: 3,
    });
    expect(prisma.dict_item_versions.create).toHaveBeenCalledWith({
      data: {
        dictItemId: 7,
        version: 2,
        label: '旧标签',
        value: 'old_value',
        description: null,
        sortOrder: 1,
        isEnabled: true,
      },
    });
  });

  it('shares only user owned dictionary items', async () => {
    const prisma = createBasePrisma();
    prisma.dict_items.findUnique.mockResolvedValue(
      createDictItem({ id: 7, scope: 'SYSTEM', userId: null })
    );

    const service = new DictService(prisma);

    await expect(service.share(userId, 7)).rejects.toThrow(ForbiddenException);

    prisma.dict_items.findUnique.mockResolvedValue(
      createDictItem({ id: 8, scope: 'USER', userId, shareStatus: 'PRIVATE' })
    );
    prisma.dict_items.update.mockResolvedValue(
      createDictItem({ id: 8, scope: 'USER', userId, shareStatus: 'SHARED' })
    );

    await expect(service.share(userId, 8)).resolves.toMatchObject({ shareStatus: 'SHARED' });
  });

  it('forks shared items into the current user dictionary', async () => {
    const prisma = createBasePrisma();
    prisma.dict_items.findUnique.mockResolvedValue(
      createDictItem({ id: 11, scope: 'USER', userId: 200, shareStatus: 'SHARED' })
    );
    prisma.dict_items.findFirst.mockResolvedValue(null);
    prisma.dict_items.create.mockResolvedValue(
      createDictItem({ id: 12, scope: 'USER', userId, sourceItemId: 11 })
    );

    const service = new DictService(prisma);

    await expect(service.fork(userId, 11)).resolves.toMatchObject({
      id: 12,
      scope: 'USER',
      userId,
      sourceItemId: 11,
    });
  });

  it('blocks inaccessible project scoped creation', async () => {
    const prisma = createBasePrisma();
    prisma.projects.findFirst.mockResolvedValue(null);

    const service = new DictService(prisma);

    await expect(
      service.create(userId, {
        categoryCode: 'novel_types',
        label: '项目词条',
        value: 'project_item',
        scope: 'PROJECT',
        projectId: 99,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks duplicate values inside the same scope', async () => {
    const prisma = createBasePrisma();
    prisma.dict_items.findFirst.mockResolvedValue(
      createDictItem({ id: 20, scope: 'USER', userId })
    );

    const service = new DictService(prisma);

    await expect(
      service.create(userId, {
        categoryCode: 'novel_types',
        label: '重复',
        value: 'fantasy',
      })
    ).rejects.toThrow(BadRequestException);
  });
});
