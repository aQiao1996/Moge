import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import type { User } from '@moge/types';

// 扩展Request类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * 设定库控制器
 * 提供设定库数据的API接口，用于项目创建时的设定关联选择
 */
@ApiTags('设定库')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * 获取角色设定库列表
   * 用于项目创建时选择关联的角色设定
   */
  @Get('characters/library')
  @ApiOperation({
    summary: '获取角色设定库',
    description: '获取当前用户的所有角色设定，用于项目创建时的关联选择',
  })
  @ApiResponse({
    status: 200,
    description: '角色设定列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '叶凡' },
              type: { type: 'string', example: '主角' },
              description: { type: 'string', example: '主角，修仙者' },
              tags: { type: 'array', items: { type: 'string' }, example: ['主角', '修仙'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getCharacterLibrary(@Req() req: AuthenticatedRequest) {
    const data = await this.settingsService.getCharacterLibrary(Number(req.user.id));
    return data;
  }

  /**
   * 获取系统设定库列表
   * 用于项目创建时选择关联的系统设定
   */
  @Get('systems/library')
  @ApiOperation({
    summary: '获取系统设定库',
    description: '获取当前用户的所有系统设定，用于项目创建时的关联选择',
  })
  @ApiResponse({
    status: 200,
    description: '系统设定列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '修仙系统' },
              type: { type: 'string', example: '修炼' },
              description: { type: 'string', example: '提供修炼指导' },
              tags: { type: 'array', items: { type: 'string' }, example: ['修炼', '系统'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getSystemLibrary(@Req() req: AuthenticatedRequest) {
    const data = await this.settingsService.getSystemLibrary(Number(req.user.id));
    return data;
  }

  /**
   * 获取世界设定库列表
   * 用于项目创建时选择关联的世界设定
   */
  @Get('worlds/library')
  @ApiOperation({
    summary: '获取世界设定库',
    description: '获取当前用户的所有世界设定，用于项目创建时的关联选择',
  })
  @ApiResponse({
    status: 200,
    description: '世界设定列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '修仙界' },
              type: { type: 'string', example: '修仙' },
              era: { type: 'string', example: '上古时期' },
              description: { type: 'string', example: '修仙者的世界' },
              tags: { type: 'array', items: { type: 'string' }, example: ['修仙', '上古'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getWorldLibrary(@Req() req: AuthenticatedRequest) {
    const data = await this.settingsService.getWorldLibrary(Number(req.user.id));
    return data;
  }

  /**
   * 获取辅助设定库列表
   * 用于项目创建时选择关联的辅助设定
   */
  @Get('misc/library')
  @ApiOperation({
    summary: '获取辅助设定库',
    description: '获取当前用户的所有辅助设定，用于项目创建时的关联选择',
  })
  @ApiResponse({
    status: 200,
    description: '辅助设定列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '修炼等级' },
              type: { type: 'string', example: '创作工具集' },
              description: { type: 'string', example: '境界划分设定' },
              tags: { type: 'array', items: { type: 'string' }, example: ['修炼', '等级'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getMiscLibrary(@Req() req: AuthenticatedRequest) {
    const data = await this.settingsService.getMiscLibrary(Number(req.user.id));
    return data;
  }
}
