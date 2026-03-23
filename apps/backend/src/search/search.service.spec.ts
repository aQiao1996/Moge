import { SearchService } from './search.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  it('searches project settings before applying result limits', async () => {
    const findProjectMock = jest.fn().mockResolvedValue({
      characters: ['42'],
      systems: [],
      worlds: [],
      misc: [],
    });
    const findCharactersMock = jest.fn().mockResolvedValue([
      {
        id: 42,
        name: '目标角色',
        background: '命中项目关联角色',
      },
    ]);

    const prisma = {
      projects: {
        findFirst: findProjectMock,
      },
      character_settings: {
        findMany: findCharactersMock,
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
    } as unknown as PrismaService;

    const service = new SearchService(prisma);

    await expect(service.searchSettings('目标', 9, 100)).resolves.toEqual([
      {
        id: 42,
        type: 'character',
        name: '目标角色',
        description: '命中项目关联角色',
        projectId: null,
      },
    ]);

    expect(findProjectMock).toHaveBeenCalledWith({
      where: {
        id: 9,
        userId: 100,
      },
      select: {
        characters: true,
        systems: true,
        worlds: true,
        misc: true,
      },
    });

    expect(findCharactersMock).toHaveBeenCalledWith({
      where: {
        id: { in: [42] },
        name: {
          contains: '目标',
          mode: 'insensitive',
        },
        userId: 100,
      },
      select: {
        id: true,
        name: true,
        background: true,
      },
      take: 10,
    });
  });

  it('returns empty results when the project is not accessible', async () => {
    const findProjectMock = jest.fn().mockResolvedValue(null);
    const findCharactersMock = jest.fn();

    const prisma = {
      projects: {
        findFirst: findProjectMock,
      },
      character_settings: {
        findMany: findCharactersMock,
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
    } as unknown as PrismaService;

    const service = new SearchService(prisma);

    await expect(service.searchSettings('不存在', 3, 100)).resolves.toEqual([]);
    expect(findCharactersMock).not.toHaveBeenCalled();
  });
});
