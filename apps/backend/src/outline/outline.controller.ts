import {
  Body,
  Controller,
  Post,
  Request,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
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
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('pageNum') pageNum?: number,
    @Query('pageSize') pageSize?: number
  ) {
    const userId = req.user.id;
    return this.outlineService.findAll(userId, pageNum, pageSize);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取指定ID的大纲详情' })
  @ApiParam({ name: 'id', description: '大纲ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiUnauthorizedResponse({ description: '未授权' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.outlineService.findOne(id, userId);
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
}
