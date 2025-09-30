import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import type { User } from '@moge/types';
import type { Prisma } from '../../generated/prisma';

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

  /**
   * 创建角色设定
   */
  @Post('characters')
  @ApiOperation({ summary: '创建角色设定', description: '创建新的角色设定' })
  @ApiResponse({ status: 201, description: '角色设定创建成功' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: '叶凡' },
        type: { type: 'string', example: '主角' },
        gender: { type: 'string', example: '男' },
        age: { type: 'string', example: '18' },
        height: { type: 'string', example: '180cm' },
        appearance: { type: 'string', example: '英俊潇洒' },
        personality: { type: 'string', example: '正直勇敢' },
        background: { type: 'string', example: '出身平凡' },
        occupation: { type: 'string', example: '修仙者' },
        powerLevel: { type: 'string', example: '筑基期' },
        abilities: { type: 'string', example: '剑术精湛' },
        relationships: { type: 'array', items: { type: 'object' } },
        tags: { type: 'array', items: { type: 'string' }, example: ['主角', '修仙'] },
        remarks: { type: 'string', example: '备注信息' },
      },
    },
  })
  async createCharacter(
    @Req() req: AuthenticatedRequest,
    @Body() data: Omit<Prisma.character_settingsCreateInput, 'user'>
  ) {
    return this.settingsService.createCharacter(Number(req.user.id), data);
  }

  /**
   * 更新角色设定
   */
  @Put('characters/:id')
  @ApiOperation({ summary: '更新角色设定', description: '更新指定ID的角色设定' })
  @ApiParam({ name: 'id', description: '角色设定ID' })
  @ApiResponse({ status: 200, description: '角色设定更新成功' })
  async updateCharacter(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Prisma.character_settingsUpdateInput
  ) {
    return this.settingsService.updateCharacter(Number(req.user.id), id, data);
  }

  /**
   * 删除角色设定
   * 如果角色被项目关联，则不允许删除
   */
  @Delete('characters/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除角色设定',
    description: '删除指定ID的角色设定（有关联项目时不允许删除）',
  })
  @ApiParam({ name: 'id', description: '角色设定ID' })
  @ApiResponse({ status: 200, description: '角色设定删除成功' })
  @ApiResponse({ status: 400, description: '角色设定被项目关联，无法删除' })
  async deleteCharacter(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.settingsService.deleteCharacter(Number(req.user.id), id);
  }

  /**
   * 获取角色设定的关联项目列表
   */
  @Get('characters/:id/projects')
  @ApiOperation({
    summary: '获取角色设定的关联项目',
    description: '获取关联了该角色设定的所有项目',
  })
  @ApiParam({ name: 'id', description: '角色设定ID' })
  @ApiResponse({
    status: 200,
    description: '关联项目列表',
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
              id: { type: 'number' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getCharacterProjects(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.settingsService.getCharacterProjects(Number(req.user.id), id);
  }
}
