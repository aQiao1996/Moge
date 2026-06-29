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
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  createProjectRequestSchema,
  type CreateProjectRequest,
  updateProjectRequestSchema,
  type UpdateProjectRequest,
  updateProjectCharactersSchema,
  type UpdateProjectCharactersInput,
  updateProjectSystemsSchema,
  type UpdateProjectSystemsInput,
  updateProjectWorldsSchema,
  type UpdateProjectWorldsInput,
  updateProjectMiscSchema,
  type UpdateProjectMiscInput,
  updateProjectAiConfigRequestSchema,
  type UpdateProjectAiConfigInput,
  createProjectPromptPresetRequestSchema,
  type CreateProjectPromptPresetInput,
  updateProjectPromptPresetRequestSchema,
  type UpdateProjectPromptPresetInput,
  appendProjectPromptPresetVersionRequestSchema,
  type AppendProjectPromptPresetVersionInput,
  addProjectMemberRequestSchema,
  type AddProjectMemberInput,
  updateProjectMemberRequestSchema,
  type UpdateProjectMemberInput,
  createProjectMemoryItemRequestSchema,
  type CreateProjectMemoryItemInput,
  updateProjectMemoryItemRequestSchema,
  type UpdateProjectMemoryItemInput,
  createProjectKnowledgeDocumentRequestSchema,
  type CreateProjectKnowledgeDocumentInput,
  updateProjectKnowledgeDocumentRequestSchema,
  type UpdateProjectKnowledgeDocumentInput,
} from './projects.schemas';

// 扩展Request类型以包含用户信息
interface AuthenticatedRequest extends Request {
  user: User;
}

export type ProjectsAuthenticatedRequest = AuthenticatedRequest;

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
   * 获取项目级 AI 配置
   */
  @Get(':id/ai-config')
  @ApiOperation({
    summary: '获取项目级 AI 配置',
    description: '获取当前项目的 AI 模型、上下文和结果应用策略配置',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '项目级 AI 配置' })
  @ApiResponse({ status: 404, description: '项目不存在或无权限访问' })
  async getProjectAiConfig(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.projectsService.getProjectAiConfig(Number(req.user.id), id);
  }

  /**
   * 获取项目可用 Prompt 预设
   */
  @Get(':id/ai-prompt-presets')
  @ApiOperation({
    summary: '获取项目可用 Prompt 预设',
    description: '获取系统预设和当前项目可用的 Prompt 预设',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: 'Prompt 预设列表' })
  async getProjectPromptPresets(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.projectsService.getProjectPromptPresets(Number(req.user.id), id);
  }

  /**
   * 创建项目级 Prompt 预设
   */
  @Post(':id/ai-prompt-presets')
  @ApiOperation({
    summary: '创建项目级 Prompt 预设',
    description: '创建项目级 Prompt 预设并写入初始版本',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 201, description: 'Prompt 预设创建成功' })
  async createProjectPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(createProjectPromptPresetRequestSchema))
    data: CreateProjectPromptPresetInput
  ) {
    return this.projectsService.createProjectPromptPreset(Number(req.user.id), id, data);
  }

  /**
   * 创建个人 Prompt 预设
   */
  @Post(':id/ai-prompt-presets/user')
  @ApiOperation({
    summary: '创建个人 Prompt 预设',
    description: '创建当前用户可跨项目复用的 Prompt 预设，并写入初始版本',
  })
  @ApiParam({ name: 'id', description: '项目ID，用于校验当前用户是否可在该项目入口创建预设' })
  @ApiResponse({ status: 201, description: 'Prompt 预设创建成功' })
  async createUserPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(createProjectPromptPresetRequestSchema))
    data: CreateProjectPromptPresetInput
  ) {
    return this.projectsService.createUserPromptPreset(Number(req.user.id), id, data);
  }

  /**
   * 更新个人 Prompt 预设元信息
   */
  @Put(':id/ai-prompt-presets/user/:presetId')
  @ApiOperation({
    summary: '更新个人 Prompt 预设',
    description: '更新当前用户个人 Prompt 预设的编码、名称和描述，不修改历史版本',
  })
  @ApiParam({ name: 'id', description: '项目ID，用于校验当前用户上下文' })
  @ApiParam({ name: 'presetId', description: 'Prompt 预设ID' })
  @ApiResponse({ status: 200, description: 'Prompt 预设更新成功' })
  async updateUserPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ZodValidationPipe(updateProjectPromptPresetRequestSchema))
    data: UpdateProjectPromptPresetInput
  ) {
    return this.projectsService.updateUserPromptPreset(Number(req.user.id), id, presetId, data);
  }

  /**
   * 追加个人 Prompt 预设版本
   */
  @Post(':id/ai-prompt-presets/user/:presetId/versions')
  @ApiOperation({
    summary: '追加个人 Prompt 预设版本',
    description: '为当前用户个人 Prompt 预设追加新版本，不覆盖历史版本',
  })
  @ApiParam({ name: 'id', description: '项目ID，用于校验当前用户上下文' })
  @ApiParam({ name: 'presetId', description: 'Prompt 预设ID' })
  @ApiResponse({ status: 201, description: 'Prompt 预设版本创建成功' })
  async appendUserPromptPresetVersion(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ZodValidationPipe(appendProjectPromptPresetVersionRequestSchema))
    data: AppendProjectPromptPresetVersionInput
  ) {
    return this.projectsService.appendUserPromptPresetVersion(
      Number(req.user.id),
      id,
      presetId,
      data
    );
  }

  /**
   * 停用个人 Prompt 预设
   */
  @Delete(':id/ai-prompt-presets/user/:presetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '停用个人 Prompt 预设',
    description: '软停用当前用户个人 Prompt 预设，不删除历史版本',
  })
  @ApiParam({ name: 'id', description: '项目ID，用于校验当前用户上下文' })
  @ApiParam({ name: 'presetId', description: 'Prompt 预设ID' })
  async disableUserPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number
  ) {
    return this.projectsService.disableUserPromptPreset(Number(req.user.id), id, presetId);
  }

  /**
   * 更新项目级 Prompt 预设元信息
   */
  @Put(':id/ai-prompt-presets/:presetId')
  @ApiOperation({
    summary: '更新项目级 Prompt 预设',
    description: '更新项目级 Prompt 预设的编码、名称和描述，不修改历史版本',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'presetId', description: 'Prompt 预设ID' })
  @ApiResponse({ status: 200, description: 'Prompt 预设更新成功' })
  async updateProjectPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ZodValidationPipe(updateProjectPromptPresetRequestSchema))
    data: UpdateProjectPromptPresetInput
  ) {
    return this.projectsService.updateProjectPromptPreset(Number(req.user.id), id, presetId, data);
  }

  /**
   * 追加项目级 Prompt 预设版本
   */
  @Post(':id/ai-prompt-presets/:presetId/versions')
  @ApiOperation({
    summary: '追加项目级 Prompt 预设版本',
    description: '为已有项目级 Prompt 预设追加新版本，不覆盖历史版本',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'presetId', description: 'Prompt 预设ID' })
  @ApiResponse({ status: 201, description: 'Prompt 预设版本创建成功' })
  async appendProjectPromptPresetVersion(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number,
    @Body(new ZodValidationPipe(appendProjectPromptPresetVersionRequestSchema))
    data: AppendProjectPromptPresetVersionInput
  ) {
    return this.projectsService.appendProjectPromptPresetVersion(
      Number(req.user.id),
      id,
      presetId,
      data
    );
  }

  /**
   * 克隆可用 Prompt 预设为项目预设
   */
  @Post(':id/ai-prompt-presets/:presetId/clone')
  @ApiOperation({
    summary: '克隆 Prompt 预设',
    description: '将系统预设或当前项目预设克隆为新的项目级 Prompt 预设',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'presetId', description: '源 Prompt 预设ID' })
  @ApiResponse({ status: 201, description: 'Prompt 预设克隆成功' })
  async cloneProjectPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number
  ) {
    return this.projectsService.cloneProjectPromptPreset(Number(req.user.id), id, presetId);
  }

  /**
   * 停用项目级 Prompt 预设
   */
  @Delete(':id/ai-prompt-presets/:presetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '停用项目级 Prompt 预设',
    description: '软停用项目级 Prompt 预设，不删除历史版本',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'presetId', description: 'Prompt 预设ID' })
  async disableProjectPromptPreset(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('presetId', ParseIntPipe) presetId: number
  ) {
    return this.projectsService.disableProjectPromptPreset(Number(req.user.id), id, presetId);
  }

  /**
   * 更新项目级 AI 配置
   */
  @Put(':id/ai-config')
  @ApiOperation({
    summary: '更新项目级 AI 配置',
    description: '更新当前项目的 AI 模型、上下文和结果应用策略配置',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '项目级 AI 配置更新成功' })
  @ApiResponse({ status: 404, description: '项目不存在或无权限访问' })
  async updateProjectAiConfig(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateProjectAiConfigRequestSchema))
    data: UpdateProjectAiConfigInput
  ) {
    return this.projectsService.upsertProjectAiConfig(Number(req.user.id), id, data);
  }

  /**
   * 获取项目协作成员
   */
  @Get(':id/members')
  @ApiOperation({ summary: '获取项目协作成员' })
  @ApiParam({ name: 'id', description: '项目ID' })
  async getProjectMembers(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getProjectMembers(Number(req.user.id), id);
  }

  /**
   * 添加或更新项目协作成员
   */
  @Post(':id/members')
  @ApiOperation({ summary: '添加或更新项目协作成员' })
  @ApiParam({ name: 'id', description: '项目ID' })
  async addProjectMember(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(addProjectMemberRequestSchema)) data: AddProjectMemberInput
  ) {
    return this.projectsService.addProjectMember(Number(req.user.id), id, data);
  }

  /**
   * 更新项目协作成员角色
   */
  @Put(':id/members/:userId')
  @ApiOperation({ summary: '更新项目协作成员角色' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'userId', description: '成员用户ID' })
  async updateProjectMember(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) memberUserId: number,
    @Body(new ZodValidationPipe(updateProjectMemberRequestSchema)) data: UpdateProjectMemberInput
  ) {
    return this.projectsService.updateProjectMember(Number(req.user.id), id, memberUserId, data);
  }

  /**
   * 移除项目协作成员
   */
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '移除项目协作成员' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'userId', description: '成员用户ID' })
  async removeProjectMember(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) memberUserId: number
  ) {
    return this.projectsService.removeProjectMember(Number(req.user.id), id, memberUserId);
  }

  @Get(':id/memory')
  @ApiOperation({ summary: '获取项目记忆列表' })
  @ApiParam({ name: 'id', description: '项目ID' })
  async listProjectMemoryItems(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.projectsService.listProjectMemoryItems(Number(req.user.id), id);
  }

  @Post(':id/memory')
  @ApiOperation({ summary: '创建项目记忆' })
  @ApiParam({ name: 'id', description: '项目ID' })
  async createProjectMemoryItem(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(createProjectMemoryItemRequestSchema))
    data: CreateProjectMemoryItemInput
  ) {
    return this.projectsService.createProjectMemoryItem(Number(req.user.id), id, data);
  }

  @Put(':id/memory/:memoryId')
  @ApiOperation({ summary: '更新项目记忆' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'memoryId', description: '项目记忆ID' })
  async updateProjectMemoryItem(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @Body(new ZodValidationPipe(updateProjectMemoryItemRequestSchema))
    data: UpdateProjectMemoryItemInput
  ) {
    return this.projectsService.updateProjectMemoryItem(Number(req.user.id), id, memoryId, data);
  }

  @Delete(':id/memory/:memoryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除项目记忆' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'memoryId', description: '项目记忆ID' })
  async deleteProjectMemoryItem(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('memoryId', ParseIntPipe) memoryId: number
  ) {
    return this.projectsService.deleteProjectMemoryItem(Number(req.user.id), id, memoryId);
  }

  /**
   * 获取项目知识资料
   */
  @Get(':id/knowledge-documents')
  @ApiOperation({
    summary: '获取项目知识资料',
    description: '获取项目下可用于 AI 上下文的资料文档',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '项目知识资料列表' })
  async listProjectKnowledgeDocuments(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.projectsService.listProjectKnowledgeDocuments(Number(req.user.id), id);
  }

  /**
   * 创建项目知识资料
   */
  @Post(':id/knowledge-documents')
  @ApiOperation({
    summary: '创建项目知识资料',
    description: '创建项目资料文档并写入轻量切片',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 201, description: '项目知识资料创建成功' })
  async createProjectKnowledgeDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(createProjectKnowledgeDocumentRequestSchema))
    data: CreateProjectKnowledgeDocumentInput
  ) {
    return this.projectsService.createProjectKnowledgeDocument(Number(req.user.id), id, data);
  }

  /**
   * 更新项目知识资料
   */
  @Put(':id/knowledge-documents/:documentId')
  @ApiOperation({
    summary: '更新项目知识资料',
    description: '更新项目资料文档，内容变更时重建轻量切片',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'documentId', description: '资料ID' })
  @ApiResponse({ status: 200, description: '项目知识资料更新成功' })
  async updateProjectKnowledgeDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body(new ZodValidationPipe(updateProjectKnowledgeDocumentRequestSchema))
    data: UpdateProjectKnowledgeDocumentInput
  ) {
    return this.projectsService.updateProjectKnowledgeDocument(
      Number(req.user.id),
      id,
      documentId,
      data
    );
  }

  /**
   * 删除项目知识资料
   */
  @Delete(':id/knowledge-documents/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除项目知识资料',
    description: '删除项目资料文档及其切片',
  })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiParam({ name: 'documentId', description: '资料ID' })
  @ApiResponse({ status: 200, description: '项目知识资料删除成功' })
  async deleteProjectKnowledgeDocument(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number
  ) {
    return this.projectsService.deleteProjectKnowledgeDocument(Number(req.user.id), id, documentId);
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
    @Body(new ZodValidationPipe(createProjectRequestSchema)) data: CreateProjectRequest
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
    @Body(new ZodValidationPipe(updateProjectRequestSchema)) data: UpdateProjectRequest
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
    @Body(new ZodValidationPipe(updateProjectCharactersSchema)) body: UpdateProjectCharactersInput
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
    @Body(new ZodValidationPipe(updateProjectSystemsSchema)) body: UpdateProjectSystemsInput
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
    @Body(new ZodValidationPipe(updateProjectWorldsSchema)) body: UpdateProjectWorldsInput
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
    @Body(new ZodValidationPipe(updateProjectMiscSchema)) body: UpdateProjectMiscInput
  ) {
    return this.projectsService.updateProjectMisc(Number(req.user.id), id, body.miscIds);
  }
}
