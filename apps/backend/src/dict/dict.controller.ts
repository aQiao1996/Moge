import { Controller, Get, Query } from '@nestjs/common';
import { DictService } from './dict.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Dict } from '@moge/types';

@ApiTags('Dictionary')
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get()
  @ApiOperation({ summary: '根据类型查询字典数据', description: '例如: type=novel_type' })
  @ApiQuery({ name: 'type', required: true, description: '字典类型' })
  @ApiResponse({ status: 200, description: '成功返回字典数据数组', type: [Object] })
  async findByType(@Query('type') type: string): Promise<Dict[]> {
    return this.dictService.findByType(type);
  }
}
