import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  character_settings,
  system_settings,
  world_settings,
  misc_settings,
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
        tags: true,
        background: true, // 使用background作为描述
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
}
