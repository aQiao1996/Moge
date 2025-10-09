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
   * @returns 角色设定列表
   */
  async getCharacterLibrary(userId: number): Promise<Partial<character_settings>[]> {
    return this.prisma.character_settings.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        gender: true,
        age: true,
        height: true,
        appearance: true,
        personality: true,
        background: true,
        occupation: true,
        powerLevel: true,
        abilities: true,
        relationships: true,
        tags: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取用户的所有系统设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 系统设定列表
   */
  async getSystemLibrary(userId: number): Promise<Partial<system_settings>[]> {
    return this.prisma.system_settings.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取用户的所有世界设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 世界设定列表
   */
  async getWorldLibrary(userId: number): Promise<Partial<world_settings>[]> {
    return this.prisma.world_settings.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        era: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取用户的所有辅助设定（用于项目关联选择）
   * @param userId 用户ID
   * @returns 辅助设定列表
   */
  async getMiscLibrary(userId: number): Promise<Partial<misc_settings>[]> {
    return this.prisma.misc_settings.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
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
   * 创建世界设定
   * @param userId 用户ID
   * @param data 世界设定数据
   * @returns 创建的世界设定
   */
  async createWorld(
    userId: number,
    data: Omit<Prisma.world_settingsCreateInput, 'user'>
  ): Promise<world_settings> {
    return this.prisma.world_settings.create({
      data: {
        ...data,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  /**
   * 更新世界设定
   * @param userId 用户ID
   * @param id 世界设定ID
   * @param data 更新的世界设定数据
   * @returns 更新后的世界设定
   */
  async updateWorld(
    userId: number,
    id: number,
    data: Prisma.world_settingsUpdateInput
  ): Promise<world_settings> {
    // 检查世界设定是否存在且属于当前用户
    const world = await this.prisma.world_settings.findFirst({
      where: { id, userId },
    });

    if (!world) {
      throw new NotFoundException('世界设定不存在或无权限访问');
    }

    // 更新世界设定
    return this.prisma.world_settings.update({
      where: { id },
      data,
    });
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
