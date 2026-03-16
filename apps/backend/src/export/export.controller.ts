import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  Body,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportService } from './export.service';
import type { Response } from 'express';

interface AuthRequest {
  user?: { id: number };
}

/**
 * 导出控制器
 * 提供文稿导出相关的API接口
 */
@ApiTags('导出')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  private getUserId(req: AuthRequest): number {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('未登录');
    }
    return userId;
  }

  /**
   * 导出单个章节为TXT
   */
  @Get('chapter/:id/txt')
  @ApiOperation({ summary: '导出单个章节为TXT' })
  @ApiParam({ name: 'id', description: '章节ID' })
  async exportChapterToTxt(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Res() res: Response
  ) {
    const userId = this.getUserId(req);
    const content = await this.exportService.exportChapterToTxt(Number(id), userId);

    // 设置响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="chapter_${id}.txt"`);

    return res.send(content);
  }

  /**
   * 导出整个文稿为TXT
   */
  @Get('manuscript/:id/txt')
  @ApiOperation({ summary: '导出整个文稿为TXT' })
  @ApiParam({ name: 'id', description: '文稿ID' })
  @ApiQuery({ name: 'includeMetadata', description: '是否包含元数据', required: false })
  @ApiQuery({ name: 'preserveFormatting', description: '是否保留格式', required: false })
  async exportManuscriptToTxt(
    @Param('id') id: string,
    @Query('includeMetadata') includeMetadata: string,
    @Query('preserveFormatting') preserveFormatting: string,
    @Request() req: AuthRequest,
    @Res() res: Response
  ) {
    const userId = this.getUserId(req);
    const options = {
      format: 'txt' as const,
      includeMetadata: includeMetadata === 'true',
      preserveFormatting: preserveFormatting === 'true',
    };

    const content = await this.exportService.exportManuscriptToTxt(Number(id), userId, options);

    // 获取文稿名称作为文件名
    const manuscript = await this.exportService['prisma'].manuscripts.findUnique({
      where: { id: Number(id) },
      select: { name: true },
    });

    const filename = `${manuscript?.name || 'manuscript'}_${new Date().getTime()}.txt`;

    // 设置响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    return res.send(content);
  }

  /**
   * 导出整个文稿为Markdown
   */
  @Get('manuscript/:id/markdown')
  @ApiOperation({ summary: '导出整个文稿为Markdown' })
  @ApiParam({ name: 'id', description: '文稿ID' })
  async exportManuscriptToMarkdown(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Res() res: Response
  ) {
    const userId = this.getUserId(req);
    const content = await this.exportService.exportManuscriptToMarkdown(Number(id), userId);

    // 获取文稿名称作为文件名
    const manuscript = await this.exportService['prisma'].manuscripts.findUnique({
      where: { id: Number(id) },
      select: { name: true },
    });

    const filename = `${manuscript?.name || 'manuscript'}_${new Date().getTime()}.md`;

    // 设置响应头
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    return res.send(content);
  }

  /**
   * 批量导出章节
   */
  @Post('chapters/batch')
  @ApiOperation({ summary: '批量导出多个章节' })
  async exportChaptersBatch(
    @Body() body: { chapterIds: number[]; format?: string },
    @Request() req: AuthRequest
  ) {
    const userId = this.getUserId(req);
    return this.exportService.exportChaptersBatch(body.chapterIds, userId, {
      format: (body.format || 'txt') as 'txt' | 'markdown',
    });
  }

  /**
   * 预览导出内容
   */
  @Get('preview/:type/:id')
  @ApiOperation({ summary: '预览导出内容' })
  @ApiParam({ name: 'type', description: '类型：chapter或manuscript' })
  @ApiParam({ name: 'id', description: 'ID' })
  async previewExport(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query('format') format: string,
    @Request() req: AuthRequest
  ) {
    const userId = this.getUserId(req);
    let content = '';

    if (type === 'chapter') {
      content = await this.exportService.exportChapterToTxt(Number(id), userId);
    } else if (type === 'manuscript') {
      if (format === 'markdown') {
        content = await this.exportService.exportManuscriptToMarkdown(Number(id), userId);
      } else {
        content = await this.exportService.exportManuscriptToTxt(Number(id), userId, {
          format: 'txt',
          includeMetadata: true,
        });
      }
    } else {
      throw new BadRequestException('不支持的预览类型');
    }

    return {
      content,
      format: format === 'markdown' ? 'markdown' : 'txt',
    };
  }
}
