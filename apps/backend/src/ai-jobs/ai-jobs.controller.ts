import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiJobStatus } from '../../generated/prisma';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiJobsService, type ListAiJobsOptions } from './ai-jobs.service';

export interface AiJobsAuthenticatedRequest {
  user: {
    id: number | string;
  };
}

export interface ListAiJobsQuery {
  status?: AiJobStatus;
  limit?: string;
}

@ApiTags('AI任务中心')
@Controller('ai-jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiJobsController {
  constructor(private readonly aiJobsService: AiJobsService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的 AI 后台任务列表' })
  async listJobs(@Request() req: AiJobsAuthenticatedRequest, @Query() query: ListAiJobsQuery) {
    return this.aiJobsService.listJobs(Number(req.user.id), this.parseListOptions(query));
  }

  @Get(':id')
  @ApiOperation({ summary: '获取当前用户的单个 AI 后台任务' })
  async getJob(@Request() req: AiJobsAuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.aiJobsService.getJob(Number(req.user.id), id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消当前用户的 AI 后台任务' })
  async cancelJob(
    @Request() req: AiJobsAuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.aiJobsService.cancelJob(Number(req.user.id), id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: '重试当前用户的 AI 后台任务' })
  async retryJob(
    @Request() req: AiJobsAuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.aiJobsService.retryJob(Number(req.user.id), id);
  }

  private parseListOptions(query: ListAiJobsQuery): ListAiJobsOptions {
    return {
      status: query.status,
      limit: query.limit ? Number(query.limit) : undefined,
    };
  }
}
