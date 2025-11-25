import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';

interface AuthRequest {
  user?: {
    id: number;
  };
}

/**
 * 统一搜索控制器
 * 提供 @ 引用系统的搜索功能
 */
@ApiTags('搜索')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 统一搜索设定
   * 搜索所有类型的设定（角色、系统、世界、辅助）
   */
  @Get('settings')
  @ApiOperation({ summary: '统一搜索设定' })
  @ApiQuery({ name: 'q', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'projectId', description: '项目ID（可选）', required: false })
  async searchSettings(
    @Query('q') q: string,
    @Query('projectId') projectId?: string,
    @Request() req?: AuthRequest
  ) {
    const userId = req?.user?.id;
    const parsedProjectId = projectId ? parseInt(projectId, 10) : undefined;

    const results = await this.searchService.searchSettings(q, parsedProjectId, userId);

    return {
      success: true,
      data: results,
      total: results.length,
    };
  }

  /**
   * 获取设定详情
   * 根据类型和ID获取特定设定的详细信息
   */
  @Get('setting')
  @ApiOperation({ summary: '获取设定详情' })
  @ApiQuery({
    name: 'type',
    description: '设定类型',
    enum: ['character', 'system', 'world', 'misc'],
    required: true,
  })
  @ApiQuery({ name: 'id', description: '设定ID', required: true })
  async getSettingDetail(
    @Query('type') type: 'character' | 'system' | 'world' | 'misc',
    @Query('id') id: string,
    @Request() req?: AuthRequest
  ) {
    const userId = req?.user?.id;
    const parsedId = parseInt(id, 10);

    const setting = await this.searchService.getSettingByTypeAndId(type, parsedId, userId);

    if (!setting) {
      return {
        success: false,
        message: '设定不存在',
        data: null,
      };
    }

    return {
      success: true,
      data: setting,
    };
  }

  /**
   * 获取反向链接
   * 查询哪些内容引用了当前设定
   */
  @Get('backlinks')
  @ApiOperation({ summary: '获取设定的反向链接' })
  @ApiQuery({
    name: 'type',
    description: '设定类型',
    enum: ['character', 'system', 'world', 'misc'],
    required: true,
  })
  @ApiQuery({ name: 'id', description: '设定ID', required: true })
  async getBacklinks(
    @Query('type') type: 'character' | 'system' | 'world' | 'misc',
    @Query('id') id: string,
    @Request() req?: AuthRequest
  ) {
    const userId = req?.user?.id;
    const parsedId = parseInt(id, 10);

    const backlinks = await this.searchService.getBacklinks(type, parsedId, userId);

    return {
      success: true,
      data: backlinks,
      total: backlinks.length,
    };
  }
}
