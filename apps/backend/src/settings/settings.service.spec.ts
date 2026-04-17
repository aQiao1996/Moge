import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  const userId = 100;

  function createBasePrisma() {
    return {
      character_settings: {
        findFirst: jest.fn().mockResolvedValue({ id: 7, userId, name: '叶凡' }),
        delete: jest.fn().mockResolvedValue({ id: 7 }),
      },
      system_settings: {
        findFirst: jest.fn().mockResolvedValue({ id: 7, userId, name: '修炼系统' }),
        delete: jest.fn().mockResolvedValue({ id: 7 }),
      },
      world_settings: {
        findFirst: jest.fn().mockResolvedValue({ id: 7, userId, name: '修仙界' }),
        delete: jest.fn().mockResolvedValue({ id: 7 }),
      },
      misc_settings: {
        findFirst: jest.fn().mockResolvedValue({ id: 7, userId, name: '等级表' }),
        delete: jest.fn().mockResolvedValue({ id: 7 }),
      },
      projects: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      outline: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      manuscripts: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;
  }

  it('blocks deleting a character when referenced by project, outline and manuscript with grouped message', async () => {
    const prisma = createBasePrisma();
    const projectFindMany = prisma.projects.findMany.bind(prisma.projects) as jest.Mock;
    const outlineFindMany = prisma.outline.findMany.bind(prisma.outline) as jest.Mock;
    const manuscriptFindMany = prisma.manuscripts.findMany.bind(prisma.manuscripts) as jest.Mock;
    const deleteMock = prisma.character_settings.delete.bind(
      prisma.character_settings
    ) as jest.Mock;

    projectFindMany.mockResolvedValue([{ name: '仙路项目' }]);
    outlineFindMany.mockResolvedValue([{ name: '飞升大纲' }]);
    manuscriptFindMany.mockResolvedValue([{ name: '飞升正文' }]);

    const service = new SettingsService(prisma);

    await expect(service.deleteCharacter(userId, 7)).rejects.toThrow(BadRequestException);
    await expect(service.deleteCharacter(userId, 7)).rejects.toThrow(
      '已被以下内容引用，无法删除：项目《仙路项目》；大纲《飞升大纲》；文稿《飞升正文》'
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('blocks deleting a world when referenced only by outlines', async () => {
    const prisma = createBasePrisma();
    const outlineFindMany = prisma.outline.findMany.bind(prisma.outline) as jest.Mock;
    const deleteMock = prisma.world_settings.delete.bind(prisma.world_settings) as jest.Mock;

    outlineFindMany.mockResolvedValue([{ name: '诸界大纲' }, { name: '边荒大纲' }]);

    const service = new SettingsService(prisma);

    await expect(service.deleteWorld(userId, 7)).rejects.toThrow(
      '已被以下内容引用，无法删除：大纲《诸界大纲》、《边荒大纲》'
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('deletes a misc setting when no project, outline or manuscript references remain', async () => {
    const prisma = createBasePrisma();
    const deleteMock = prisma.misc_settings.delete.bind(prisma.misc_settings) as jest.Mock;

    const service = new SettingsService(prisma);

    await expect(service.deleteMisc(userId, 7)).resolves.toEqual({ message: '辅助设定删除成功' });
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: 7 },
    });
  });
});
