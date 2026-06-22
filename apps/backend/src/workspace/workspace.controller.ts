import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';
import {
  CreateWorkspaceIdeaDto,
  CreateWorkspaceTodoDto,
  UpdateWorkspaceTodoDto,
} from './workspace.dto';

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

  private getUserId(req: AuthRequest): number {
    const userId = req?.user?.id;
    if (!userId) {
      throw new UnauthorizedException('未登录');
    }

    return userId;
  }

  /**
   * 获取工作台汇总数据
   */
  @Get('summary')
  @ApiOperation({ summary: '获取工作台汇总数据' })
  async getWorkspaceSummary(@Request() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.workspaceService.getWorkspaceSummary(userId);
  }

  /**
   * 获取最近的项目
   */
  @Get('recent-projects')
  @ApiOperation({ summary: '获取最近的项目' })
  async getRecentProjects(@Request() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.workspaceService.getRecentProjects(userId);
  }

  /**
   * 获取最近的大纲
   */
  @Get('recent-outlines')
  @ApiOperation({ summary: '获取最近的大纲' })
  async getRecentOutlines(@Request() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.workspaceService.getRecentOutlines(userId);
  }

  /**
   * 获取最近的文稿
   */
  @Get('recent-manuscripts')
  @ApiOperation({ summary: '获取最近的文稿' })
  async getRecentManuscripts(@Request() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.workspaceService.getRecentManuscripts(userId);
  }

  /**
   * 获取写作统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取写作统计' })
  async getWritingStats(@Request() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.workspaceService.getWritingStats(userId);
  }

  /**
   * 获取工作台待办和灵感
   */
  @Get('items')
  @ApiOperation({ summary: '获取工作台待办和灵感' })
  async getWorkspaceItems(@Request() req: AuthRequest) {
    const userId = this.getUserId(req);

    return this.workspaceService.getWorkspaceItems(userId);
  }

  /**
   * 创建工作台待办
   */
  @Post('todos')
  @ApiOperation({ summary: '创建工作台待办' })
  async createTodo(@Request() req: AuthRequest, @Body() dto: CreateWorkspaceTodoDto) {
    const userId = this.getUserId(req);

    return this.workspaceService.createTodo(userId, dto.text);
  }

  /**
   * 更新工作台待办完成状态
   */
  @Patch('todos/:id')
  @ApiOperation({ summary: '更新工作台待办完成状态' })
  async updateTodo(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceTodoDto
  ) {
    const userId = this.getUserId(req);

    return this.workspaceService.updateTodo(userId, id, dto.done);
  }

  /**
   * 删除工作台待办
   */
  @Delete('todos/:id')
  @ApiOperation({ summary: '删除工作台待办' })
  async deleteTodo(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = this.getUserId(req);

    return this.workspaceService.deleteTodo(userId, id);
  }

  /**
   * 创建工作台灵感
   */
  @Post('ideas')
  @ApiOperation({ summary: '创建工作台灵感' })
  async createIdea(@Request() req: AuthRequest, @Body() dto: CreateWorkspaceIdeaDto) {
    const userId = this.getUserId(req);

    return this.workspaceService.createIdea(userId, dto.content);
  }

  /**
   * 删除工作台灵感
   */
  @Delete('ideas/:id')
  @ApiOperation({ summary: '删除工作台灵感' })
  async deleteIdea(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = this.getUserId(req);

    return this.workspaceService.deleteIdea(userId, id);
  }
}
