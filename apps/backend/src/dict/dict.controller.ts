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
} from '@nestjs/common';
import { DictService } from './dict.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import type { dict_items } from '../../generated/prisma';

// 创建和更新的DTO接口
interface CreateDictItemDto {
  categoryCode: string;
  code: string;
  label: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
}

interface UpdateDictItemDto {
  categoryCode?: string;
  code?: string;
  label?: string;
  value?: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
}

interface ToggleDictItemDto {
  isEnabled: boolean;
}

@ApiTags('Dictionary')
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get()
  @ApiOperation({ summary: '根据类型查询字典数据', description: '例如: type=novel_type' })
  @ApiQuery({ name: 'type', required: true, description: '字典类型' })
  @ApiResponse({ status: 200, description: '成功返回字典数据数组', type: [Object] })
  async findByType(@Query('type') type: string): Promise<dict_items[]> {
    return this.dictService.findByType(type);
  }

  @Post()
  @ApiOperation({ summary: '创建字典项' })
  @ApiBody({ description: '字典项数据' })
  @ApiResponse({ status: 201, description: '创建成功', type: Object })
  async create(@Body() data: CreateDictItemDto): Promise<dict_items> {
    return this.dictService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新字典项' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiBody({ description: '更新数据' })
  @ApiResponse({ status: 200, description: '更新成功', type: Object })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateDictItemDto
  ): Promise<dict_items> {
    return this.dictService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字典项' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dictService.delete(id);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: '切换字典项启用状态' })
  @ApiParam({ name: 'id', description: '字典项ID' })
  @ApiBody({ description: '启用状态' })
  @ApiResponse({ status: 200, description: '切换成功', type: Object })
  async toggle(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ToggleDictItemDto
  ): Promise<dict_items> {
    return this.dictService.toggle(id, data.isEnabled);
  }
}
