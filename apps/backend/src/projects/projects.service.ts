import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { projects } from '../../generated/prisma';
import type { CreateProjectRequest, UpdateProjectRequest } from './projects.schemas';

/**
 * 项目服务
 * 提供小说项目的数据管理功能，包括项目与设定的关联管理
 */
@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private normalizeStoredSettingIds(ids?: string[]): string[] | undefined {
    if (ids === undefined) {
      return undefined;
    }

    const normalizedIds = ids.map((id) => {
      const normalizedId = String(id).trim();

      if (!/^\d+$/.test(normalizedId)) {
        throw new BadRequestException('设定 ID 格式不正确');
      }

      return String(Number(normalizedId));
    });

    return Array.from(new Set(normalizedIds));
  }

  private normalizeNumericSettingIds(ids: number[]): number[] {
    return Array.from(
      new Set(
        ids.map((id) => {
          if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException('设定 ID 格式不正确');
          }

          return id;
        })
      )
    );
  }

  private async assertCharactersOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.character_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分角色设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertSystemsOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.system_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分系统设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertWorldsOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.world_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分世界设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async assertMiscOwned(userId: number, ids?: string[]) {
    if (!ids || ids.length === 0) {
      return ids;
    }

    const normalizedIds = this.normalizeStoredSettingIds(ids) ?? [];
    const count = await this.prisma.misc_settings.count({
      where: {
        userId,
        id: { in: normalizedIds.map(Number) },
      },
    });

    if (count !== normalizedIds.length) {
      throw new BadRequestException('部分辅助设定不存在或无权限访问');
    }

    return normalizedIds;
  }

  private async validateProjectAssociations(
    userId: number,
    data: Pick<CreateProjectRequest, 'characters' | 'systems' | 'worlds' | 'misc'> &
      Pick<UpdateProjectRequest, 'characters' | 'systems' | 'worlds' | 'misc'>
  ) {
    const [characters, systems, worlds, misc] = await Promise.all([
      this.assertCharactersOwned(userId, data.characters),
      this.assertSystemsOwned(userId, data.systems),
      this.assertWorldsOwned(userId, data.worlds),
      this.assertMiscOwned(userId, data.misc),
    ]);

    return { characters, systems, worlds, misc };
  }

  /**
   * 获取用户的所有项目
   * @param userId 用户ID
   * @returns 项目列表
   */
  async getProjects(userId: number): Promise<projects[]> {
    return this.prisma.projects.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据ID获取单个项目详情
   * @param userId 用户ID
   * @param id 项目ID
   * @returns 项目详情
   */
  async getProjectById(userId: number, id: number): Promise<projects> {
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    return project;
  }

  /**
   * 创建项目
   * @param userId 用户ID
   * @param data 项目创建数据
   * @returns 创建的项目
   */
  async createProject(userId: number, data: CreateProjectRequest): Promise<projects> {
    const relations = await this.validateProjectAssociations(userId, data);

    return this.prisma.projects.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        tags: data.tags ?? [],
        characters: relations.characters ?? [],
        systems: relations.systems ?? [],
        worlds: relations.worlds ?? [],
        misc: relations.misc ?? [],
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  /**
   * 更新项目
   * @param userId 用户ID
   * @param id 项目ID
   * @param data 更新的项目数据
   * @returns 更新后的项目
   */
  async updateProject(userId: number, id: number, data: UpdateProjectRequest): Promise<projects> {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    const relations = await this.validateProjectAssociations(userId, data);
    const updateData: Partial<projects> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }
    if (relations.characters !== undefined) {
      updateData.characters = relations.characters;
    }
    if (relations.systems !== undefined) {
      updateData.systems = relations.systems;
    }
    if (relations.worlds !== undefined) {
      updateData.worlds = relations.worlds;
    }
    if (relations.misc !== undefined) {
      updateData.misc = relations.misc;
    }

    return this.prisma.projects.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 删除项目
   * @param userId 用户ID
   * @param id 项目ID
   * @returns 删除结果
   */
  async deleteProject(userId: number, id: number): Promise<{ message: string }> {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    // 删除项目
    await this.prisma.projects.delete({
      where: { id },
    });

    return { message: '项目删除成功' };
  }

  /**
   * 获取项目关联的所有设定
   * @param userId 用户ID
   * @param id 项目ID
   * @returns 包含所有关联设定的详细数据
   */
  async getProjectSettings(userId: number, id: number) {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    // 获取关联的角色设定
    const characters = await this.prisma.character_settings.findMany({
      where: {
        userId,
        id: {
          in: project.characters.map((id) => Number(id)),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        gender: true,
        age: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 获取关联的系统设定
    const systems = await this.prisma.system_settings.findMany({
      where: {
        userId,
        id: {
          in: project.systems.map((id) => Number(id)),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 获取关联的世界设定
    const worlds = await this.prisma.world_settings.findMany({
      where: {
        userId,
        id: {
          in: project.worlds.map((id) => Number(id)),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        era: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 获取关联的辅助设定
    const misc = await this.prisma.misc_settings.findMany({
      where: {
        userId,
        id: {
          in: project.misc.map((id) => Number(id)),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      characters,
      systems,
      worlds,
      misc,
    };
  }

  /**
   * 更新项目关联的角色设定
   * @param userId 用户ID
   * @param id 项目ID
   * @param characterIds 角色设定ID数组
   * @returns 更新后的项目
   */
  async updateProjectCharacters(
    userId: number,
    id: number,
    characterIds: number[]
  ): Promise<projects> {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    const normalizedIds = this.normalizeNumericSettingIds(characterIds);
    const characters = await this.prisma.character_settings.count({
      where: {
        userId,
        id: { in: normalizedIds },
      },
    });

    if (characters !== normalizedIds.length) {
      throw new BadRequestException('部分角色设定不存在或无权限访问');
    }

    // 更新项目的角色关联
    return this.prisma.projects.update({
      where: { id },
      data: {
        characters: normalizedIds.map(String),
      },
    });
  }

  /**
   * 更新项目关联的系统设定
   * @param userId 用户ID
   * @param id 项目ID
   * @param systemIds 系统设定ID数组
   * @returns 更新后的项目
   */
  async updateProjectSystems(userId: number, id: number, systemIds: number[]): Promise<projects> {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    // 验证所有系统设定是否存在且属于当前用户
    const normalizedIds = this.normalizeNumericSettingIds(systemIds);
    const systems = await this.prisma.system_settings.count({
      where: {
        userId,
        id: { in: normalizedIds },
      },
    });

    if (systems !== normalizedIds.length) {
      throw new BadRequestException('部分系统设定不存在或无权限访问');
    }

    // 更新项目的系统关联
    return this.prisma.projects.update({
      where: { id },
      data: {
        systems: normalizedIds.map(String),
      },
    });
  }

  /**
   * 更新项目关联的世界设定
   * @param userId 用户ID
   * @param id 项目ID
   * @param worldIds 世界设定ID数组
   * @returns 更新后的项目
   */
  async updateProjectWorlds(userId: number, id: number, worldIds: number[]): Promise<projects> {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    // 验证所有世界设定是否存在且属于当前用户
    const normalizedIds = this.normalizeNumericSettingIds(worldIds);
    const worlds = await this.prisma.world_settings.count({
      where: {
        userId,
        id: { in: normalizedIds },
      },
    });

    if (worlds !== normalizedIds.length) {
      throw new BadRequestException('部分世界设定不存在或无权限访问');
    }

    // 更新项目的世界关联
    return this.prisma.projects.update({
      where: { id },
      data: {
        worlds: normalizedIds.map(String),
      },
    });
  }

  /**
   * 更新项目关联的辅助设定
   * @param userId 用户ID
   * @param id 项目ID
   * @param miscIds 辅助设定ID数组
   * @returns 更新后的项目
   */
  async updateProjectMisc(userId: number, id: number, miscIds: number[]): Promise<projects> {
    // 检查项目是否存在且属于当前用户
    const project = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    // 验证所有辅助设定是否存在且属于当前用户
    const normalizedIds = this.normalizeNumericSettingIds(miscIds);
    const misc = await this.prisma.misc_settings.count({
      where: {
        userId,
        id: { in: normalizedIds },
      },
    });

    if (misc !== normalizedIds.length) {
      throw new BadRequestException('部分辅助设定不存在或无权限访问');
    }

    // 更新项目的辅助设定关联
    return this.prisma.projects.update({
      where: { id },
      data: {
        misc: normalizedIds.map(String),
      },
    });
  }
}
