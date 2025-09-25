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
import {
  createOutlineSchema,
  type CreateOutlineValues,
  updateOutlineSchema,
  type UpdateOutlineValues,
} from '@moge/types';
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

import type { Outline, User } from '@moge/types';

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
      properties: {
        title: { type: 'string', description: '标题' },
        content: { type: 'string', description: '内容' },
        model: { type: 'string', description: '模型' },
      },
      required: ['title', 'content', 'model'],
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
    @Body(new ZodValidationPipe(createOutlineSchema)) data: CreateOutlineValues
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
  @ApiQuery({ name: 'tags', required: false, type: [String], description: '标签' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt', 'type'],
    description: '排序字段',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: '排序方向',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('pageNum') pageNum?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('era') era?: string,
    @Query('status') status?: Outline['status'],
    @Query('tags') tags?: string | string[],
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'type',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const userId = req.user.id;

    // 处理 tags 参数（可能是字符串或数组）
    const tagsArray = tags ? (Array.isArray(tags) ? tags : [tags]) : undefined;

    return this.outlineService.findAll(userId, {
      pageNum,
      pageSize,
      search,
      type,
      era,
      status,
      tags: tagsArray,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定ID的大纲基本信息' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
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
    @Body() data: { content: string }
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
    @Body() data: { title: string; description?: string }
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
    @Body() data: { title: string; content?: string }
  ): Promise<unknown> {
    const userId = req.user.id;
    return this.outlineService.updateChapter(id, chapterId, userId, data);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新大纲' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiBody({ description: '要更新的大纲信息', type: Object })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateOutlineSchema)) data: UpdateOutlineValues
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
}
