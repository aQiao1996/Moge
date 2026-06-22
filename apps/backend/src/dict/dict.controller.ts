import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { DictService } from './dict.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import type { dict_items, dict_categories, dict_item_versions } from '../../generated/prisma';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  createDictItemRequestSchema,
  dictCommunityQuerySchema,
  dictListQuerySchema,
  toggleDictItemRequestSchema,
  updateDictItemRequestSchema,
  type CreateDictItemRequest,
  type DictCommunityQueryInput,
  type DictListQueryInput,
  type ToggleDictItemRequest,
  type UpdateDictItemRequest,
} from './dict.schemas';

// 字典分类DTO接口
interface CreateDictCategoryDto {
  code: string;
  name: string;
  description?: string;
}

interface UpdateDictCategoryDto {
  code?: string;
  name?: string;
  description?: string;
}

// 创建和更新的DTO接口
interface AuthRequest {
  user?: {
    id: number;
  };
}

/**
 * 字典管理控制器
 * 提供字典分类和字典项的REST API接口
 */
@ApiTags('Dictionary')
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  private getUserId(req: AuthRequest): number {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('未登录');
    }

    return userId;
  }

  // ==================== 字典分类接口 ====================

  /**
   * 获取所有字典分类
   * @returns 字典分类数组
   */
  @Get('categories')
  @ApiOperation({ summary: '获取所有字典分类' })
  @ApiResponse({ status: 200, description: '成功返回字典分类数组', type: [Object] })
  async findAllCategories(): Promise<dict_categories[]> {
    return this.dictService.findAllCategories();
  }

  /**
   * 创建字典分类
   * @param data 字典分类数据
   * @returns 创建的字典分类对象
   */
  @Post('categories')
  @ApiOperation({ summary: '创建字典分类' })
  @ApiBody({ description: '字典分类数据' })
  @ApiResponse({ status: 201, description: '创建成功', type: Object })
  async createCategory(@Body() data: CreateDictCategoryDto): Promise<dict_categories> {
    return this.dictService.createCategory(data);
  }

  /**
   * 更新字典分类
   * @param id 字典分类ID
   * @param data 更新数据
   * @returns 更新后的字典分类对象
   */
  @Put('categories/:id')
  @ApiOperation({ summary: '更新字典分类' })
  @ApiParam({ name: 'id', description: '字典分类ID' })
  @ApiBody({ description: '更新数据' })
  @ApiResponse({ status: 200, description: '更新成功', type: Object })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateDictCategoryDto
  ): Promise<dict_categories> {
    return this.dictService.updateCategory(id, data);
  }

  /**
   * 删除字典分类
   * @param id 字典分类ID
   */
  @Delete('categories/:id')
  @ApiOperation({ summary: '删除字典分类' })
  @ApiParam({ name: 'id', description: '字典分类ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dictService.deleteCategory(id);
  }

  // ==================== 统计接口 ====================

  /**
   * 获取字典统计数据
   * 返回各分类下的字典项数量统计
   * @returns 包含分类代码和数量的统计数组
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取字典统计数据' })
  @ApiResponse({ status: 200, description: '成功返回统计数据', type: [Object] })
  async getStatistics(
    @Request() req: AuthRequest
  ): Promise<{ categoryCode: string; count: number }[]> {
    return this.dictService.getStatistics(this.getUserId(req));
  }

  // ==================== 字典项接口 ====================

  /**
   * 根据类型查询字典数据
   * @param type 字典类型代码
   * @returns 该类型下的字典项数组
   */
  @Get()
  @ApiOperation({ summary: '根据类型查询字典数据', description: '例如: type=novel_type' })
  @ApiQuery({ name: 'type', required: true, description: '字典类型' })
  @ApiQuery({ name: 'projectId', required: false, description: '项目ID' })
  @ApiQuery({ name: 'scope', required: false, description: '作用域：SYSTEM/USER/PROJECT' })
  @ApiResponse({ status: 200, description: '成功返回字典数据数组', type: [Object] })
  async findByType(
    @Request() req: AuthRequest,
    @Query(new ZodValidationPipe(dictListQuerySchema)) query: DictListQueryInput
  ): Promise<dict_items[]> {
    return this.dictService.findByType(query.type, this.getUserId(req), {
      projectId: query.projectId,
      scope: query.scope,
    });
  }

  @Get('community')
  @ApiOperation({ summary: '获取社区共享词条' })
  @ApiQuery({ name: 'type', required: false, description: '字典类型' })
  @ApiResponse({ status: 200, description: '成功返回社区共享词条', type: [Object] })
  async findCommunity(
    @Query(new ZodValidationPipe(dictCommunityQuerySchema)) query: DictCommunityQueryInput
  ): Promise<dict_items[]> {
    return this.dictService.findCommunity(query.type);
  }

  /**
   * 创建字典项
   * @param data 字典项数据
   * @returns 创建的字典项对象
   */
  @Post()
  @ApiOperation({ summary: '创建字典项' })
  @ApiBody({ description: '字典项数据' })
  @ApiResponse({ status: 201, description: '创建成功', type: Object })
  async create(
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(createDictItemRequestSchema)) data: CreateDictItemRequest
  ): Promise<dict_items> {
    return this.dictService.create(this.getUserId(req), data);
  }

  /**
   * 更新字典项
   * @param id 字典项ID
   * @param data 更新数据
   * @returns 更新后的字典项对象
   */
  @Put(':id')
  @ApiOperation({ summary: '更新字典项' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiBody({ description: '更新数据' })
  @ApiResponse({ status: 200, description: '更新成功', type: Object })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(updateDictItemRequestSchema)) data: UpdateDictItemRequest
  ): Promise<dict_items> {
    return this.dictService.update(this.getUserId(req), id, data);
  }

  /**
   * 删除字典项
   * @param id 字典项ID
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除字典项' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest): Promise<void> {
    return this.dictService.delete(this.getUserId(req), id);
  }

  /**
   * 切换字典项启用状态
   * @param id 字典项ID
   * @param data 包含启用状态的数据
   * @returns 更新后的字典项对象
   */
  @Patch(':id/toggle')
  @ApiOperation({ summary: '切换字典项启用状态' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiBody({ description: '启用状态' })
  @ApiResponse({ status: 200, description: '切换成功', type: Object })
  async toggle(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(toggleDictItemRequestSchema)) data: ToggleDictItemRequest
  ): Promise<dict_items> {
    return this.dictService.toggle(this.getUserId(req), id, data.isEnabled);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '获取字典词条版本历史' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiResponse({ status: 200, description: '版本历史', type: [Object] })
  async findVersions(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest
  ): Promise<dict_item_versions[]> {
    return this.dictService.findVersions(this.getUserId(req), id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: '分享个人词条到社区' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiResponse({ status: 200, description: '分享成功', type: Object })
  async share(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest
  ): Promise<dict_items> {
    return this.dictService.share(this.getUserId(req), id);
  }

  @Post(':id/archive-share')
  @ApiOperation({ summary: '取消社区分享' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiResponse({ status: 200, description: '取消分享成功', type: Object })
  async archiveShare(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest
  ): Promise<dict_items> {
    return this.dictService.archiveShare(this.getUserId(req), id);
  }

  @Post(':id/fork')
  @ApiOperation({ summary: '复制系统或社区词条到个人字典' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiResponse({ status: 201, description: '复制成功', type: Object })
  async fork(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest
  ): Promise<dict_items> {
    return this.dictService.fork(this.getUserId(req), id);
  }
}
