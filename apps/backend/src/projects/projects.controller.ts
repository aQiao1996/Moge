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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import type { User } from '@moge/types';
import type { Prisma } from '../../generated/prisma';

// 扩展Request类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * 项目管理控制器
 * 提供小说项目的CRUD接口，以及项目与设定的关联管理
 */
@ApiTags('项目管理')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * 获取用户的所有项目
   */
  @Get()
  @ApiOperation({
    summary: '获取项目列表',
    description: '获取当前用户的所有小说项目',
  })
  @ApiResponse({
    status: 200,
    description: '项目列表',
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
              tags: { type: 'array', items: { type: 'string' } },
              characters: { type: 'array', items: { type: 'string' } },
              systems: { type: 'array', items: { type: 'string' } },
              worlds: { type: 'array', items: { type: 'string' } },
              misc: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getProjects(@Req() req: AuthenticatedRequest) {
    const data = await this.projectsService.getProjects(Number(req.user.id));
    return data;
  }

  /**
   * 根据ID获取单个项目详情
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取项目详情',
    description: '根据ID获取单个项目的详细信息',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '项目详情' })
  @ApiResponse({ status: 404, description: '项目不存在或无权限访问' })
  async getProjectById(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getProjectById(Number(req.user.id), id);
  }

  /**
   * 创建项目
   */
  @Post()
  @ApiOperation({ summary: '创建项目', description: '创建新的小说项目' })
  @ApiResponse({ status: 201, description: '项目创建成功' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        name: { type: 'string', example: '仙侠传说' },
        type: { type: 'string', example: '仙侠' },
        description: { type: 'string', example: '一个关于修仙的故事' },
        tags: { type: 'array', items: { type: 'string' }, example: ['修仙', '热血'] },
        characters: {
          type: 'array',
          items: { type: 'string' },
          example: ['1', '2'],
          description: '关联的角色设定ID数组',
        },
        systems: {
          type: 'array',
          items: { type: 'string' },
          example: ['1'],
          description: '关联的系统设定ID数组',
        },
        worlds: {
          type: 'array',
          items: { type: 'string' },
          example: ['1'],
          description: '关联的世界设定ID数组',
        },
        misc: {
          type: 'array',
          items: { type: 'string' },
          example: [],
          description: '关联的辅助设定ID数组',
        },
      },
    },
  })
  async createProject(
    @Req() req: AuthenticatedRequest,
    @Body() data: Omit<Prisma.projectsCreateInput, 'user'>
  ) {
    return this.projectsService.createProject(Number(req.user.id), data);
  }

  /**
   * 更新项目
   */
  @Put(':id')
  @ApiOperation({ summary: '更新项目', description: '更新指定ID的项目信息' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '项目更新成功' })
  @ApiResponse({ status: 404, description: '项目不存在或无权限访问' })
  async updateProject(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Prisma.projectsUpdateInput
  ) {
    return this.projectsService.updateProject(Number(req.user.id), id, data);
  }

  /**
   * 删除项目
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除项目', description: '删除指定ID的项目' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '项目删除成功' })
  @ApiResponse({ status: 404, description: '项目不存在或无权限访问' })
  async deleteProject(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.deleteProject(Number(req.user.id), id);
  }

  /**
   * 获取项目关联的所有设定
   */
  @Get(':id/settings')
  @ApiOperation({
    summary: '获取项目关联的所有设定',
    description: '获取项目关联的角色、系统、世界、辅助设定的详细信息',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({
    status: 200,
    description: '项目关联的所有设定',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            characters: { type: 'array', items: { type: 'object' } },
            systems: { type: 'array', items: { type: 'object' } },
            worlds: { type: 'array', items: { type: 'object' } },
            misc: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  async getProjectSettings(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.projectsService.getProjectSettings(Number(req.user.id), id);
  }

  /**
   * 更新项目关联的角色设定
   */
  @Put(':id/characters')
  @ApiOperation({
    summary: '更新项目关联的角色设定',
    description: '更新项目关联的角色设定ID列表',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['characterIds'],
      properties: {
        characterIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description: '角色设定ID数组',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProjectCharacters(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { characterIds: number[] }
  ) {
    return this.projectsService.updateProjectCharacters(Number(req.user.id), id, body.characterIds);
  }

  /**
   * 更新项目关联的系统设定
   */
  @Put(':id/systems')
  @ApiOperation({
    summary: '更新项目关联的系统设定',
    description: '更新项目关联的系统设定ID列表',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['systemIds'],
      properties: {
        systemIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2],
          description: '系统设定ID数组',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProjectSystems(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { systemIds: number[] }
  ) {
    return this.projectsService.updateProjectSystems(Number(req.user.id), id, body.systemIds);
  }

  /**
   * 更新项目关联的世界设定
   */
  @Put(':id/worlds')
  @ApiOperation({
    summary: '更新项目关联的世界设定',
    description: '更新项目关联的世界设定ID列表',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['worldIds'],
      properties: {
        worldIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1],
          description: '世界设定ID数组',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProjectWorlds(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { worldIds: number[] }
  ) {
    return this.projectsService.updateProjectWorlds(Number(req.user.id), id, body.worldIds);
  }

  /**
   * 更新项目关联的辅助设定
   */
  @Put(':id/misc')
  @ApiOperation({
    summary: '更新项目关联的辅助设定',
    description: '更新项目关联的辅助设定ID列表',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['miscIds'],
      properties: {
        miscIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2],
          description: '辅助设定ID数组',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProjectMisc(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { miscIds: number[] }
  ) {
    return this.projectsService.updateProjectMisc(Number(req.user.id), id, body.miscIds);
  }
}
