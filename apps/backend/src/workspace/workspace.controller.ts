import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';

interface AuthRequest {
  user?: {
    id: number;
  };
}

/**
 * 工作台控制器
 * 提供工作台相关的API接口
 */
@ApiTags('工作台')
@Controller('workspace')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * 获取工作台汇总数据
   */
  @Get('summary')
  @ApiOperation({ summary: '获取工作台汇总数据' })
  async getWorkspaceSummary(@Request() req: AuthRequest) {
    const userId = req?.user?.id;
    if (!userId) {
      return {
        success: false,
        message: '未登录',
        data: null,
      };
    }

    const summary = await this.workspaceService.getWorkspaceSummary(userId);
    return {
      success: true,
      data: summary,
    };
  }

  /**
   * 获取最近的项目
   */
  @Get('recent-projects')
  @ApiOperation({ summary: '获取最近的项目' })
  async getRecentProjects(@Request() req: AuthRequest) {
    const userId = req?.user?.id;
    if (!userId) {
      return {
        success: false,
        message: '未登录',
        data: [],
      };
    }

    const projects = await this.workspaceService.getRecentProjects(userId);
    return {
      success: true,
      data: projects,
    };
  }

  /**
   * 获取最近的大纲
   */
  @Get('recent-outlines')
  @ApiOperation({ summary: '获取最近的大纲' })
  async getRecentOutlines(@Request() req: AuthRequest) {
    const userId = req?.user?.id;
    if (!userId) {
      return {
        success: false,
        message: '未登录',
        data: [],
      };
    }

    const outlines = await this.workspaceService.getRecentOutlines(userId);
    return {
      success: true,
      data: outlines,
    };
  }

  /**
   * 获取最近的文稿
   */
  @Get('recent-manuscripts')
  @ApiOperation({ summary: '获取最近的文稿' })
  async getRecentManuscripts(@Request() req: AuthRequest) {
    const userId = req?.user?.id;
    if (!userId) {
      return {
        success: false,
        message: '未登录',
        data: [],
      };
    }

    const manuscripts = await this.workspaceService.getRecentManuscripts(userId);
    return {
      success: true,
      data: manuscripts,
    };
  }

  /**
   * 获取写作统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取写作统计' })
  async getWritingStats(@Request() req: AuthRequest) {
    const userId = req?.user?.id;
    if (!userId) {
      return {
        success: false,
        message: '未登录',
        data: null,
      };
    }

    const stats = await this.workspaceService.getWritingStats(userId);
    return {
      success: true,
      data: stats,
    };
  }
}
