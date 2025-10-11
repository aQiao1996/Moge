import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  character_settings,
  system_settings,
  world_settings,
  misc_settings,
  projects,
  Prisma,
} from '../../generated/prisma';
import type { CreateWorldDto, UpdateWorldDto } from './dto/world.dto';

/**
 * 设定库服务
 * 提供角色、系统、世界、辅助设定的数据管理功能
 */
@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户的所有角色设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 角色设定列表（包含完整数据，用于编辑）
   */
  async getCharacterLibrary(userId: number): Promise<Partial<character_settings>[]> {
    return this.prisma.character_settings.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取用户的所有系统设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 系统设定列表（包含完整数据，用于编辑）
   */
  async getSystemLibrary(userId: number): Promise<Partial<system_settings>[]> {
    return this.prisma.system_settings.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取用户的所有世界设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 世界设定列表（包含完整的扁平字段，用于编辑）
   */
  async getWorldLibrary(userId: number): Promise<Partial<world_settings>[]> {
    const worlds = await this.prisma.world_settings.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 将所有世界设定转换为扁平字段格式
    return worlds.map((world) => this.transformWorldFromPrisma(world));
  }

  /**
   * 获取用户的所有辅助设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 辅助设定列表（包含完整数据，用于编辑）
   */
  async getMiscLibrary(userId: number): Promise<Partial<misc_settings>[]> {
    return this.prisma.misc_settings.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 创建角色设定
   * @param userId 用户ID
   * @param data 角色设定数据
   * @returns 创建的角色设定
   */
  async createCharacter(
    userId: number,
    data: Omit<Prisma.character_settingsCreateInput, 'user'>
  ): Promise<character_settings> {
    return this.prisma.character_settings.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  /**
   * 更新角色设定
   * @param userId 用户ID
   * @param id 角色设定ID
   * @param data 更新的角色设定数据
   * @returns 更新后的角色设定
   */
  async updateCharacter(
    userId: number,
    id: number,
    data: Prisma.character_settingsUpdateInput
  ): Promise<character_settings> {
    // 检查角色是否存在且属于当前用户
    const character = await this.prisma.character_settings.findFirst({
      where: { id, userId },
    });

    if (!character) {
      throw new NotFoundException('角色设定不存在或无权限访问');
    }

    // 更新角色设定
    return this.prisma.character_settings.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除角色设定
   * 删除前检查是否有项目关联，如有关联则不允许删除
   * @param userId 用户ID
   * @param id 角色设定ID
   * @returns 删除结果
   */
  async deleteCharacter(userId: number, id: number): Promise<{ message: string }> {
    // 检查角色是否存在且属于当前用户
    const character = await this.prisma.character_settings.findFirst({
      where: { id, userId },
    });

    if (!character) {
      throw new NotFoundException('角色设定不存在或无权限访问');
    }

    // 检查是否有项目关联该角色
    const relatedProjects = await this.prisma.projects.findMany({
      where: {
        userId,
        characters: {
          has: String(id),
        },
      },
      select: { id: true, name: true },
    });

    if (relatedProjects.length > 0) {
      const projectNames = relatedProjects.map((p) => p.name).join('、');
      throw new BadRequestException(
        `该角色设定已被以下项目关联,无法删除:${projectNames}。请先解除项目关联后再删除。`
      );
    }

    // 删除角色设定
    await this.prisma.character_settings.delete({
      where: { id },
    });

    return { message: '角色设定删除成功' };
  }

  /**
   * 获取角色设定的关联项目列表
   * @param userId 用户ID
   * @param id 角色设定ID
   * @returns 关联的项目列表
   */
  async getCharacterProjects(userId: number, id: number): Promise<Partial<projects>[]> {
    // 检查角色是否存在且属于当前用户
    const character = await this.prisma.character_settings.findFirst({
      where: { id, userId },
    });

    if (!character) {
      throw new NotFoundException('角色设定不存在或无权限访问');
    }

    // 查询关联了该角色的所有项目
    return this.prisma.projects.findMany({
      where: {
        userId,
        characters: {
          has: String(id),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== 系统设定相关方法 ====================

  /**
   * 创建系统设定
   * @param userId 用户ID
   * @param data 系统设定数据
   * @returns 创建的系统设定
   */
  async createSystem(
    userId: number,
    data: Omit<Prisma.system_settingsCreateInput, 'user'>
  ): Promise<system_settings> {
    return this.prisma.system_settings.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  /**
   * 更新系统设定
   * @param userId 用户ID
   * @param id 系统设定ID
   * @param data 更新的系统设定数据
   * @returns 更新后的系统设定
   */
  async updateSystem(
    userId: number,
    id: number,
    data: Prisma.system_settingsUpdateInput
  ): Promise<system_settings> {
    // 检查系统设定是否存在且属于当前用户
    const system = await this.prisma.system_settings.findFirst({
      where: { id, userId },
    });

    if (!system) {
      throw new NotFoundException('系统设定不存在或无权限访问');
    }

    // 更新系统设定
    return this.prisma.system_settings.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除系统设定
   * 删除前检查是否有项目关联，如有关联则不允许删除
   * @param userId 用户ID
   * @param id 系统设定ID
   * @returns 删除结果
   */
  async deleteSystem(userId: number, id: number): Promise<{ message: string }> {
    // 检查系统设定是否存在且属于当前用户
    const system = await this.prisma.system_settings.findFirst({
      where: { id, userId },
    });

    if (!system) {
      throw new NotFoundException('系统设定不存在或无权限访问');
    }

    // 检查是否有项目关联该系统设定
    const relatedProjects = await this.prisma.projects.findMany({
      where: {
        userId,
        systems: {
          has: String(id),
        },
      },
      select: { id: true, name: true },
    });

    if (relatedProjects.length > 0) {
      const projectNames = relatedProjects.map((p) => p.name).join('、');
      throw new BadRequestException(
        `该系统设定已被以下项目关联,无法删除:${projectNames}。请先解除项目关联后再删除。`
      );
    }

    // 删除系统设定
    await this.prisma.system_settings.delete({
      where: { id },
    });

    return { message: '系统设定删除成功' };
  }

  /**
   * 获取系统设定的关联项目列表
   * @param userId 用户ID
   * @param id 系统设定ID
   * @returns 关联的项目列表
   */
  async getSystemProjects(userId: number, id: number): Promise<Partial<projects>[]> {
    // 检查系统设定是否存在且属于当前用户
    const system = await this.prisma.system_settings.findFirst({
      where: { id, userId },
    });

    if (!system) {
      throw new NotFoundException('系统设定不存在或无权限访问');
    }

    // 查询关联了该系统设定的所有项目
    return this.prisma.projects.findMany({
      where: {
        userId,
        systems: {
          has: String(id),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== 世界设定相关方法 ====================

  /**
   * 将前端扁平字段转换为数据库 JSON 格式
   * @param dto 前端发送的扁平数据
   * @returns 数据库所需的 JSON 格式数据
   */
  private transformWorldDtoToPrisma(
    dto: CreateWorldDto | UpdateWorldDto
  ): Omit<Prisma.world_settingsCreateInput, 'user'> {
    const {
      // 提取扁平字段
      generalClimate,
      majorTerrain,
      geographicLocations,
      politicalSystem,
      majorConflicts,
      politicalForces,
      socialStructure,
      languages,
      religions,
      culturalCustoms,
      powerSystemName,
      powerSystemDescription,
      cultivationResources,
      cultivationLevels,
      worldHistory,
      currentEvents,
      historicalEvents,
      historicalFigures,
      // 其余字段直接透传
      ...baseFields
    } = dto;

    // 构建数据库格式
    const result: Partial<Prisma.world_settingsCreateInput> = {
      ...baseFields,
    };

    // 转换地理环境为 JSON
    if (generalClimate !== undefined || majorTerrain !== undefined || geographicLocations) {
      result.geography = {
        generalClimate,
        majorTerrain,
        locations: geographicLocations,
      } as unknown as Prisma.InputJsonValue;
    }

    // 转换政治势力为 JSON
    if (politicalSystem !== undefined || majorConflicts !== undefined || politicalForces) {
      result.politics = {
        politicalSystem,
        majorConflicts,
        forces: politicalForces,
      } as unknown as Prisma.InputJsonValue;
    }

    // 转换文化体系为 JSON
    if (
      socialStructure !== undefined ||
      languages !== undefined ||
      religions !== undefined ||
      culturalCustoms
    ) {
      result.culture = {
        socialStructure,
        languages,
        religions,
        customs: culturalCustoms,
      } as unknown as Prisma.InputJsonValue;
    }

    // 转换力量体系为 JSON
    if (
      powerSystemName !== undefined ||
      powerSystemDescription !== undefined ||
      cultivationResources !== undefined ||
      cultivationLevels
    ) {
      result.powerSystem = {
        name: powerSystemName,
        description: powerSystemDescription,
        cultivationResources,
        levels: cultivationLevels,
      } as unknown as Prisma.InputJsonValue;
    }

    // 转换历史脉络为 JSON
    if (
      worldHistory !== undefined ||
      currentEvents !== undefined ||
      historicalEvents ||
      historicalFigures
    ) {
      result.history = {
        worldHistory,
        currentEvents,
        events: historicalEvents,
        figures: historicalFigures,
      } as unknown as Prisma.InputJsonValue;
    }

    return result as Omit<Prisma.world_settingsCreateInput, 'user'>;
  }

  /**
   * 将数据库 JSON 格式转换为前端扁平字段
   * @param world 数据库中的世界设定数据
   * @returns 前端所需的扁平格式数据
   */
  private transformWorldFromPrisma(world: world_settings): world_settings & {
    generalClimate?: string;
    majorTerrain?: string;
    geographicLocations?: unknown[];
    politicalSystem?: string;
    majorConflicts?: string;
    politicalForces?: unknown[];
    socialStructure?: string;
    languages?: string;
    religions?: string;
    culturalCustoms?: unknown[];
    powerSystemName?: string;
    powerSystemDescription?: string;
    cultivationResources?: string;
    cultivationLevels?: unknown[];
    worldHistory?: string;
    currentEvents?: string;
    historicalEvents?: unknown[];
    historicalFigures?: unknown[];
  } {
    const geography = world.geography as Record<string, unknown> | null;
    const politics = world.politics as Record<string, unknown> | null;
    const culture = world.culture as Record<string, unknown> | null;
    const powerSystem = world.powerSystem as Record<string, unknown> | null;
    const history = world.history as Record<string, unknown> | null;

    return {
      ...world,
      // 展开地理环境
      generalClimate: geography?.['generalClimate'] as string | undefined,
      majorTerrain: geography?.['majorTerrain'] as string | undefined,
      geographicLocations: (geography?.['locations'] as unknown[]) || [],
      // 展开政治势力
      politicalSystem: politics?.['politicalSystem'] as string | undefined,
      majorConflicts: politics?.['majorConflicts'] as string | undefined,
      politicalForces: (politics?.['forces'] as unknown[]) || [],
      // 展开文化体系
      socialStructure: culture?.['socialStructure'] as string | undefined,
      languages: culture?.['languages'] as string | undefined,
      religions: culture?.['religions'] as string | undefined,
      culturalCustoms: (culture?.['customs'] as unknown[]) || [],
      // 展开力量体系
      powerSystemName: powerSystem?.['name'] as string | undefined,
      powerSystemDescription: powerSystem?.['description'] as string | undefined,
      cultivationResources: powerSystem?.['cultivationResources'] as string | undefined,
      cultivationLevels: (powerSystem?.['levels'] as unknown[]) || [],
      // 展开历史脉络
      worldHistory: history?.['worldHistory'] as string | undefined,
      currentEvents: history?.['currentEvents'] as string | undefined,
      historicalEvents: (history?.['events'] as unknown[]) || [],
      historicalFigures: (history?.['figures'] as unknown[]) || [],
    };
  }

  /**
   * 获取单个世界设定详情（用于编辑）
   * @param userId 用户ID
   * @param id 世界设定ID
   * @returns 世界设定详情（扁平格式）
   */
  async getWorldById(userId: number, id: number): Promise<world_settings> {
    // 检查世界设定是否存在且属于当前用户
    const world = await this.prisma.world_settings.findFirst({
      where: { id, userId },
    });

    if (!world) {
      throw new NotFoundException('世界设定不存在或无权限访问');
    }

    // 将数据库 JSON 格式转换为扁平字段返回给前端
    return this.transformWorldFromPrisma(world);
  }

  /**
   * 创建世界设定
   * @param userId 用户ID
   * @param dto 世界设定数据（扁平格式）
   * @returns 创建的世界设定（扁平格式）
   */
  async createWorld(userId: number, dto: CreateWorldDto): Promise<world_settings> {
    // 将扁平字段转换为数据库 JSON 格式
    const prismaData = this.transformWorldDtoToPrisma(dto);

    const world = await this.prisma.world_settings.create({
      data: {
        ...prismaData,
        user: {
          connect: { id: userId },
        },
      },
    });

    // 将数据库 JSON 格式转换回扁平字段返回给前端
    return this.transformWorldFromPrisma(world);
  }

  /**
   * 更新世界设定
   * @param userId 用户ID
   * @param id 世界设定ID
   * @param dto 更新的世界设定数据（扁平格式）
   * @returns 更新后的世界设定（扁平格式）
   */
  async updateWorld(userId: number, id: number, dto: UpdateWorldDto): Promise<world_settings> {
    // 检查世界设定是否存在且属于当前用户
    const world = await this.prisma.world_settings.findFirst({
      where: { id, userId },
    });

    if (!world) {
      throw new NotFoundException('世界设定不存在或无权限访问');
    }

    // 将扁平字段转换为数据库 JSON 格式
    const prismaData = this.transformWorldDtoToPrisma(dto);

    // 更新世界设定
    const updatedWorld = await this.prisma.world_settings.update({
      where: { id },
      data: prismaData,
    });

    // 将数据库 JSON 格式转换回扁平字段返回给前端
    return this.transformWorldFromPrisma(updatedWorld);
  }

  /**
   * 删除世界设定
   * 删除前检查是否有项目关联，如有关联则不允许删除
   * @param userId 用户ID
   * @param id 世界设定ID
   * @returns 删除结果
   */
  async deleteWorld(userId: number, id: number): Promise<{ message: string }> {
    // 检查世界设定是否存在且属于当前用户
    const world = await this.prisma.world_settings.findFirst({
      where: { id, userId },
    });

    if (!world) {
      throw new NotFoundException('世界设定不存在或无权限访问');
    }

    // 检查是否有项目关联该世界设定
    const relatedProjects = await this.prisma.projects.findMany({
      where: {
        userId,
        worlds: {
          has: String(id),
        },
      },
      select: { id: true, name: true },
    });

    if (relatedProjects.length > 0) {
      const projectNames = relatedProjects.map((p) => p.name).join('、');
      throw new BadRequestException(
        `该世界设定已被以下项目关联,无法删除:${projectNames}。请先解除项目关联后再删除。`
      );
    }

    // 删除世界设定
    await this.prisma.world_settings.delete({
      where: { id },
    });

    return { message: '世界设定删除成功' };
  }

  /**
   * 获取世界设定的关联项目列表
   * @param userId 用户ID
   * @param id 世界设定ID
   * @returns 关联的项目列表
   */
  async getWorldProjects(userId: number, id: number): Promise<Partial<projects>[]> {
    // 检查世界设定是否存在且属于当前用户
    const world = await this.prisma.world_settings.findFirst({
      where: { id, userId },
    });

    if (!world) {
      throw new NotFoundException('世界设定不存在或无权限访问');
    }

    // 查询关联了该世界设定的所有项目
    return this.prisma.projects.findMany({
      where: {
        userId,
        worlds: {
          has: String(id),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== 辅助设定相关方法 ====================

  /**
   * 创建辅助设定
   * @param userId 用户ID
   * @param data 辅助设定数据
   * @returns 创建的辅助设定
   */
  async createMisc(
    userId: number,
    data: Omit<Prisma.misc_settingsCreateInput, 'user'>
  ): Promise<misc_settings> {
    return this.prisma.misc_settings.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  /**
   * 更新辅助设定
   * @param userId 用户ID
   * @param id 辅助设定ID
   * @param data 更新的辅助设定数据
   * @returns 更新后的辅助设定
   */
  async updateMisc(
    userId: number,
    id: number,
    data: Prisma.misc_settingsUpdateInput
  ): Promise<misc_settings> {
    // 检查辅助设定是否存在且属于当前用户
    const misc = await this.prisma.misc_settings.findFirst({
      where: { id, userId },
    });

    if (!misc) {
      throw new NotFoundException('辅助设定不存在或无权限访问');
    }

    // 更新辅助设定
    return this.prisma.misc_settings.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除辅助设定
   * 删除前检查是否有项目关联，如有关联则不允许删除
   * @param userId 用户ID
   * @param id 辅助设定ID
   * @returns 删除结果
   */
  async deleteMisc(userId: number, id: number): Promise<{ message: string }> {
    // 检查辅助设定是否存在且属于当前用户
    const misc = await this.prisma.misc_settings.findFirst({
      where: { id, userId },
    });

    if (!misc) {
      throw new NotFoundException('辅助设定不存在或无权限访问');
    }

    // 检查是否有项目关联该辅助设定
    const relatedProjects = await this.prisma.projects.findMany({
      where: {
        userId,
        misc: {
          has: String(id),
        },
      },
      select: { id: true, name: true },
    });

    if (relatedProjects.length > 0) {
      const projectNames = relatedProjects.map((p) => p.name).join('、');
      throw new BadRequestException(
        `该辅助设定已被以下项目关联,无法删除:${projectNames}。请先解除项目关联后再删除。`
      );
    }

    // 删除辅助设定
    await this.prisma.misc_settings.delete({
      where: { id },
    });

    return { message: '辅助设定删除成功' };
  }

  /**
   * 获取辅助设定的关联项目列表
   * @param userId 用户ID
   * @param id 辅助设定ID
   * @returns 关联的项目列表
   */
  async getMiscProjects(userId: number, id: number): Promise<Partial<projects>[]> {
    // 检查辅助设定是否存在且属于当前用户
    const misc = await this.prisma.misc_settings.findFirst({
      where: { id, userId },
    });

    if (!misc) {
      throw new NotFoundException('辅助设定不存在或无权限访问');
    }

    // 查询关联了该辅助设定的所有项目
    return this.prisma.projects.findMany({
      where: {
        userId,
        misc: {
          has: String(id),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
