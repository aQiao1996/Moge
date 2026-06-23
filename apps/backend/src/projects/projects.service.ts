import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, project_ai_configs, projects } from '../../generated/prisma';
import {
  AiContextLengthStrategy,
  AiResultApplyStrategy,
  Prisma as PrismaNamespace,
  ProjectMemberRole,
} from '../../generated/prisma';
import type {
  CreateProjectRequest,
  UpdateProjectAiConfigInput,
  UpdateProjectRequest,
  AddProjectMemberInput,
  UpdateProjectMemberInput,
} from './projects.schemas';

type ProjectAiConfigResponse = Omit<project_ai_configs, 'temperature'> & {
  temperature: string;
};

const DEFAULT_AI_CONFIG = {
  provider: 'openai_compatible',
  model: 'gpt-5.2',
  temperature: new PrismaNamespace.Decimal('0.60'),
  maxTokens: 2000,
  defaultContinuePresetId: null,
  defaultPolishPresetId: null,
  defaultExpandPresetId: null,
  defaultOutlinePresetId: null,
  enableCharacterContext: true,
  enableSystemContext: true,
  enableWorldContext: true,
  enableMiscContext: true,
  enableChapterSummaryContext: false,
  enableProjectMemoryContext: false,
  contextLengthStrategy: AiContextLengthStrategy.BALANCED,
  resultApplyStrategy: AiResultApplyStrategy.CANDIDATE,
  asyncTaskThreshold: 3000,
} satisfies Omit<Prisma.project_ai_configsUncheckedCreateInput, 'projectId'>;

type ProjectAiConfigWritableData = Omit<
  Prisma.project_ai_configsUncheckedCreateInput,
  'id' | 'projectId' | 'createdAt' | 'updatedAt'
>;

type ProjectAccessMode = 'read' | 'write' | 'owner';

/**
 * 项目服务
 * 提供小说项目的数据管理功能，包括项目与设定的关联管理
 */
@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private serializeProjectAiConfig(
    config: Omit<project_ai_configs, 'id' | 'createdAt' | 'updatedAt'> &
      Partial<Pick<project_ai_configs, 'id' | 'createdAt' | 'updatedAt'>>
  ): ProjectAiConfigResponse {
    return {
      id: config.id ?? 0,
      projectId: config.projectId,
      provider: config.provider,
      model: config.model,
      temperature: config.temperature.toFixed(2),
      maxTokens: config.maxTokens,
      defaultContinuePresetId: config.defaultContinuePresetId,
      defaultPolishPresetId: config.defaultPolishPresetId,
      defaultExpandPresetId: config.defaultExpandPresetId,
      defaultOutlinePresetId: config.defaultOutlinePresetId,
      enableCharacterContext: config.enableCharacterContext,
      enableSystemContext: config.enableSystemContext,
      enableWorldContext: config.enableWorldContext,
      enableMiscContext: config.enableMiscContext,
      enableChapterSummaryContext: config.enableChapterSummaryContext,
      enableProjectMemoryContext: config.enableProjectMemoryContext,
      contextLengthStrategy: config.contextLengthStrategy,
      resultApplyStrategy: config.resultApplyStrategy,
      asyncTaskThreshold: config.asyncTaskThreshold,
      createdAt: config.createdAt ?? new Date(0),
      updatedAt: config.updatedAt ?? new Date(0),
    };
  }

  private async getProjectForAccess(userId: number, id: number, mode: ProjectAccessMode) {
    const ownedProject = await this.prisma.projects.findFirst({
      where: { id, userId },
    });

    if (ownedProject) {
      return ownedProject;
    }

    if (mode === 'owner') {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    const member = await this.prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    if (mode === 'write' && member.role === ProjectMemberRole.VIEWER) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    const sharedProject = await this.prisma.projects.findFirst({
      where: { id },
    });

    if (!sharedProject) {
      throw new NotFoundException('项目不存在或无权限访问');
    }

    return sharedProject;
  }

  private async assertProjectOwned(userId: number, id: number): Promise<void> {
    await this.getProjectForAccess(userId, id, 'write');
  }

  private buildProjectAiConfigData(data: UpdateProjectAiConfigInput): ProjectAiConfigWritableData {
    return {
      ...DEFAULT_AI_CONFIG,
      ...data,
      temperature:
        data.temperature === undefined
          ? DEFAULT_AI_CONFIG.temperature
          : new PrismaNamespace.Decimal(data.temperature.toFixed(2)),
    };
  }

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
    return this.getProjectForAccess(userId, id, 'read');
  }

  /**
   * 获取项目级 AI 配置；未保存时返回系统默认配置。
   * @param userId 用户ID
   * @param id 项目ID
   * @returns 项目级 AI 配置
   */
  async getProjectAiConfig(userId: number, id: number): Promise<ProjectAiConfigResponse> {
    await this.getProjectForAccess(userId, id, 'read');

    const config = await this.prisma.project_ai_configs.findUnique({
      where: { projectId: id },
    });

    if (config) {
      return this.serializeProjectAiConfig(config);
    }

    return this.serializeProjectAiConfig({
      ...DEFAULT_AI_CONFIG,
      projectId: id,
    });
  }

  /**
   * 更新项目级 AI 配置；不存在时创建。
   * @param userId 用户ID
   * @param id 项目ID
   * @param data AI 配置更新数据
   * @returns 更新后的项目级 AI 配置
   */
  async upsertProjectAiConfig(
    userId: number,
    id: number,
    data: UpdateProjectAiConfigInput
  ): Promise<ProjectAiConfigResponse> {
    await this.assertProjectOwned(userId, id);

    const createData: Prisma.project_ai_configsUncheckedCreateInput = {
      ...this.buildProjectAiConfigData(data),
      projectId: id,
    };

    const updateData: Prisma.project_ai_configsUncheckedUpdateInput = {
      ...(data.provider !== undefined ? { provider: data.provider } : {}),
      ...(data.model !== undefined ? { model: data.model } : {}),
      ...(data.temperature !== undefined
        ? { temperature: new PrismaNamespace.Decimal(data.temperature.toFixed(2)) }
        : {}),
      ...(data.maxTokens !== undefined ? { maxTokens: data.maxTokens } : {}),
      ...(data.defaultContinuePresetId !== undefined
        ? { defaultContinuePresetId: data.defaultContinuePresetId }
        : {}),
      ...(data.defaultPolishPresetId !== undefined
        ? { defaultPolishPresetId: data.defaultPolishPresetId }
        : {}),
      ...(data.defaultExpandPresetId !== undefined
        ? { defaultExpandPresetId: data.defaultExpandPresetId }
        : {}),
      ...(data.defaultOutlinePresetId !== undefined
        ? { defaultOutlinePresetId: data.defaultOutlinePresetId }
        : {}),
      ...(data.enableCharacterContext !== undefined
        ? { enableCharacterContext: data.enableCharacterContext }
        : {}),
      ...(data.enableSystemContext !== undefined
        ? { enableSystemContext: data.enableSystemContext }
        : {}),
      ...(data.enableWorldContext !== undefined
        ? { enableWorldContext: data.enableWorldContext }
        : {}),
      ...(data.enableMiscContext !== undefined
        ? { enableMiscContext: data.enableMiscContext }
        : {}),
      ...(data.enableChapterSummaryContext !== undefined
        ? { enableChapterSummaryContext: data.enableChapterSummaryContext }
        : {}),
      ...(data.enableProjectMemoryContext !== undefined
        ? { enableProjectMemoryContext: data.enableProjectMemoryContext }
        : {}),
      ...(data.contextLengthStrategy !== undefined
        ? { contextLengthStrategy: data.contextLengthStrategy }
        : {}),
      ...(data.resultApplyStrategy !== undefined
        ? { resultApplyStrategy: data.resultApplyStrategy }
        : {}),
      ...(data.asyncTaskThreshold !== undefined
        ? { asyncTaskThreshold: data.asyncTaskThreshold }
        : {}),
    };

    const config = await this.prisma.project_ai_configs.upsert({
      where: { projectId: id },
      create: createData,
      update: updateData,
    });

    return this.serializeProjectAiConfig(config);
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

  async getProjectMembers(userId: number, id: number) {
    await this.getProjectForAccess(userId, id, 'read');

    return this.prisma.project_members.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addProjectMember(userId: number, id: number, data: AddProjectMemberInput) {
    await this.getProjectForAccess(userId, id, 'owner');

    if (data.userId === userId) {
      throw new BadRequestException('不能将项目所有者添加为协作成员');
    }

    return this.prisma.project_members.upsert({
      where: {
        projectId_userId: {
          projectId: id,
          userId: data.userId,
        },
      },
      create: {
        projectId: id,
        userId: data.userId,
        role: data.role,
      },
      update: {
        role: data.role,
      },
    });
  }

  async updateProjectMember(
    userId: number,
    id: number,
    memberUserId: number,
    data: UpdateProjectMemberInput
  ) {
    await this.getProjectForAccess(userId, id, 'owner');

    return this.prisma.project_members.update({
      where: {
        projectId_userId: {
          projectId: id,
          userId: memberUserId,
        },
      },
      data: {
        role: data.role,
      },
    });
  }

  async removeProjectMember(userId: number, id: number, memberUserId: number) {
    await this.getProjectForAccess(userId, id, 'owner');

    await this.prisma.project_members.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId: memberUserId,
        },
      },
    });

    return { message: '项目成员已移除' };
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
