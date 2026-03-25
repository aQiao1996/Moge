import {
  Body,
  Controller,
  Post,
  Request,
  Get,
  Patch,
  Delete,
  Put,
  Param,
  ParseIntPipe,
  Query,
  Sse,
} from '@nestjs/common';
import { OutlineService } from './outline.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { type CreateOutlineValues, type UpdateOutlineValues } from '@moge/types';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  createOutlineRequestSchema,
  updateOutlineContentSchema,
  type UpdateOutlineContentInput,
  updateOutlineRequestSchema,
  outlineListQuerySchema,
  type OutlineListQueryInput,
  outlineVolumeSchema,
  type OutlineVolumeInput,
  outlineChapterSchema,
  type OutlineChapterInput,
  updateOutlineCharactersSchema,
  type UpdateOutlineCharactersInput,
  updateOutlineSystemsSchema,
  type UpdateOutlineSystemsInput,
  updateOutlineWorldsSchema,
  type UpdateOutlineWorldsInput,
  updateOutlineMiscSchema,
  type UpdateOutlineMiscInput,
  OUTLINE_STATUS_VALUES,
  OUTLINE_SORT_BY_VALUES,
  OUTLINE_SORT_ORDER_VALUES,
} from './outline.schemas';

import type { User } from '@moge/types';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('大纲')
@Controller('outline')
export class OutlineController {
  constructor(private readonly outlineService: OutlineService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建大纲' })
  @ApiBody({
    description: '大纲信息',
    schema: {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        name: { type: 'string', description: '小说名称' },
        type: { type: 'string', description: '小说类型' },
        era: { type: 'string', description: '时代背景' },
        conflict: { type: 'string', description: '核心冲突' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' },
        remark: { type: 'string', description: '备注信息' },
        characters: { type: 'array', items: { type: 'string' }, description: '角色设定ID数组' },
        systems: { type: 'array', items: { type: 'string' }, description: '系统设定ID数组' },
        worlds: { type: 'array', items: { type: 'string' }, description: '世界设定ID数组' },
        misc: { type: 'array', items: { type: 'string' }, description: '辅助设定ID数组' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '大纲创建成功',
  })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 400, description: '大纲创建失败' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createOutlineRequestSchema)) data: CreateOutlineValues
  ) {
    const userId = req.user.id;
    return this.outlineService.create(userId, data);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户的大纲列表' })
  @ApiQuery({ name: 'pageNum', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页条数' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜索关键词' })
  @ApiQuery({ name: 'type', required: false, type: String, description: '大纲类型' })
  @ApiQuery({ name: 'era', required: false, type: String, description: '时代' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OUTLINE_STATUS_VALUES,
    description: '大纲状态',
  })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: '标签' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: OUTLINE_SORT_BY_VALUES,
    description: '排序字段',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: OUTLINE_SORT_ORDER_VALUES,
    description: '排序方向',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 400, description: '查询参数不合法' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(outlineListQuerySchema)) query: OutlineListQueryInput
  ) {
    const userId = req.user.id;

    return this.outlineService.findAll(userId, {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      search: query.search,
      type: query.type,
      era: query.era,
      status: query.status,
      tags: query.tags,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定ID的大纲基本信息' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 404, description: '大纲不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.outlineService.findOne(id, userId);
  }

  @Get(':id/detail')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定ID的大纲详情（包含完整结构）' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 404, description: '大纲不存在' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async findDetail(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.outlineService.findDetail(id, userId);
  }

  @Put(':id/content')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '保存大纲内容' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '大纲内容',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '大纲内容' },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ status: 200, description: '保存成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateContent(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineContentSchema)) data: UpdateOutlineContentInput
  ): Promise<unknown> {
    const userId = req.user.id;
    return this.outlineService.updateContent(id, userId, data.content);
  }

  @Put(':id/volume/:volumeId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新卷信息' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiParam({ name: 'volumeId', description: '卷ID' })
  @ApiBody({
    description: '卷信息',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '卷标题' },
        description: { type: 'string', description: '卷描述' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateVolume(
    @Param('id', ParseIntPipe) id: number,
    @Param('volumeId', ParseIntPipe) volumeId: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(outlineVolumeSchema)) data: OutlineVolumeInput
  ): Promise<unknown> {
    const userId = req.user.id;
    return this.outlineService.updateVolume(id, volumeId, userId, data);
  }

  @Put(':id/chapter/:chapterId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新章节信息' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiParam({ name: 'chapterId', description: '章节ID' })
  @ApiBody({
    description: '章节信息',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '章节标题' },
        content: { type: 'string', description: '章节内容' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(outlineChapterSchema)) data: OutlineChapterInput
  ): Promise<unknown> {
    const userId = req.user.id;
    return this.outlineService.updateChapter(id, chapterId, userId, data);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新大纲' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '要更新的大纲信息',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '小说名称' },
        type: { type: 'string', description: '小说类型' },
        era: { type: 'string', description: '时代背景' },
        conflict: { type: 'string', description: '核心冲突' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' },
        remark: { type: 'string', description: '备注信息' },
        status: {
          type: 'string',
          enum: ['DRAFT', 'GENERATING', 'GENERATED', 'PUBLISHED', 'DISCARDED'],
          description: '大纲状态',
        },
        characters: { type: 'array', items: { type: 'string' }, description: '角色设定ID数组' },
        systems: { type: 'array', items: { type: 'string' }, description: '系统设定ID数组' },
        worlds: { type: 'array', items: { type: 'string' }, description: '世界设定ID数组' },
        misc: { type: 'array', items: { type: 'string' }, description: '辅助设定ID数组' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineRequestSchema)) data: UpdateOutlineValues
  ) {
    const userId = req.user.id;
    return this.outlineService.update(id, userId, data);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除大纲' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    await this.outlineService.delete(id, userId);
    return { message: '删除成功' };
  }

  @Get(':id/generate-stream')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '通过流式生成大纲内容' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '开始流式传输' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @Sse()
  generateContentStream(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.outlineService.generateContentStream(id, userId);
  }

  /**
   * 获取大纲关联的所有设定
   */
  @Get(':id/settings')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取大纲关联的所有设定' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async getOutlineSettings(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user.id;
    return this.outlineService.getOutlineSettings(id, userId);
  }

  /**
   * 更新大纲关联的角色设定
   */
  @Put(':id/characters')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新大纲关联的角色设定' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '角色设定ID列表',
    schema: {
      type: 'object',
      properties: {
        characters: { type: 'array', items: { type: 'number' }, description: '角色设定ID数组' },
      },
      required: ['characters'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateOutlineCharacters(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineCharactersSchema)) data: UpdateOutlineCharactersInput
  ) {
    const userId = req.user.id;
    return this.outlineService.updateOutlineCharacters(id, userId, data.characters);
  }

  /**
   * 更新大纲关联的系统设定
   */
  @Put(':id/systems')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新大纲关联的系统设定' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '系统设定ID列表',
    schema: {
      type: 'object',
      properties: {
        systems: { type: 'array', items: { type: 'number' }, description: '系统设定ID数组' },
      },
      required: ['systems'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateOutlineSystems(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineSystemsSchema)) data: UpdateOutlineSystemsInput
  ) {
    const userId = req.user.id;
    return this.outlineService.updateOutlineSystems(id, userId, data.systems);
  }

  /**
   * 更新大纲关联的世界设定
   */
  @Put(':id/worlds')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新大纲关联的世界设定' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '世界设定ID列表',
    schema: {
      type: 'object',
      properties: {
        worlds: { type: 'array', items: { type: 'number' }, description: '世界设定ID数组' },
      },
      required: ['worlds'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateOutlineWorlds(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineWorldsSchema)) data: UpdateOutlineWorldsInput
  ) {
    const userId = req.user.id;
    return this.outlineService.updateOutlineWorlds(id, userId, data.worlds);
  }

  /**
   * 更新大纲关联的辅助设定
   */
  @Put(':id/misc')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新大纲关联的辅助设定' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '辅助设定ID列表',
    schema: {
      type: 'object',
      properties: {
        misc: { type: 'array', items: { type: 'number' }, description: '辅助设定ID数组' },
      },
      required: ['misc'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async updateOutlineMisc(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineMiscSchema)) data: UpdateOutlineMiscInput
  ) {
    const userId = req.user.id;
    return this.outlineService.updateOutlineMisc(id, userId, data.misc);
  }

  /**
   * 创建新卷
   */
  @Post(':id/volume')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建新卷' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '卷信息',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '卷标题' },
        description: { type: 'string', description: '卷描述' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async createVolume(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(outlineVolumeSchema)) data: OutlineVolumeInput
  ) {
    const userId = req.user.id;
    return this.outlineService.createVolume(id, userId, data);
  }

  /**
   * 创建直接章节（无卷）
   */
  @Post(':id/chapter')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建直接章节（无卷）' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({
    description: '章节信息',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '章节标题' },
        content: { type: 'string', description: '章节内容' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async createChapter(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(outlineChapterSchema)) data: OutlineChapterInput
  ) {
    const userId = req.user.id;
    return this.outlineService.createChapter(id, userId, data);
  }

  /**
   * 在指定卷下创建章节
   */
  @Post(':id/volume/:volumeId/chapter')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '在指定卷下创建章节' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiParam({ name: 'volumeId', description: '卷ID' })
  @ApiBody({
    description: '章节信息',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '章节标题' },
        content: { type: 'string', description: '章节内容' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async createChapterInVolume(
    @Param('id', ParseIntPipe) id: number,
    @Param('volumeId', ParseIntPipe) volumeId: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(outlineChapterSchema)) data: OutlineChapterInput
  ) {
    const userId = req.user.id;
    return this.outlineService.createChapterInVolume(id, volumeId, userId, data);
  }

  /**
   * 删除卷
   */
  @Delete(':id/volume/:volumeId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除卷（会同时删除卷下的所有章节）' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiParam({ name: 'volumeId', description: '卷ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async deleteVolume(
    @Param('id', ParseIntPipe) id: number,
    @Param('volumeId', ParseIntPipe) volumeId: number,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user.id;
    await this.outlineService.deleteVolume(id, volumeId, userId);
    return { message: '删除成功' };
  }

  /**
   * 删除章节
   */
  @Delete(':id/chapter/:chapterId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除章节' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiParam({ name: 'chapterId', description: '章节ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async deleteChapter(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Request() req: AuthenticatedRequest
  ) {
    const userId = req.user.id;
    await this.outlineService.deleteChapter(id, chapterId, userId);
    return { message: '删除成功' };
  }
}
