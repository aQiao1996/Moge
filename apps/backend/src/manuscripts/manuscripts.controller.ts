import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ManuscriptsService } from './manuscripts.service';
import {
  CreateManuscriptDto,
  UpdateManuscriptDto,
  CreateVolumeDto,
  UpdateVolumeDto,
  CreateChapterDto,
  UpdateChapterDto,
  SaveChapterContentDto,
} from './manuscripts.dto';
import type { User } from '@moge/types';

interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * 文稿控制器
 */
@Controller('manuscripts')
export class ManuscriptsController {
  constructor(private readonly manuscriptsService: ManuscriptsService) {}

  /**
   * 创建文稿
   */
  @Post()
  async createManuscript(@Request() req: AuthenticatedRequest, @Body() dto: CreateManuscriptDto) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.createManuscript(userId, dto);
  }

  /**
   * 从大纲创建文稿
   */
  @Post('from-outline/:outlineId')
  async createFromOutline(
    @Request() req: AuthenticatedRequest,
    @Param('outlineId', ParseIntPipe) outlineId: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.createManuscriptFromOutline(userId, outlineId);
  }

  /**
   * 获取所有文稿
   */
  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.findAll(userId);
  }

  /**
   * 获取单个文稿
   */
  @Get(':id')
  async findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.findOne(id, userId);
  }

  /**
   * 更新文稿
   */
  @Put(':id')
  async updateManuscript(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManuscriptDto
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.updateManuscript(id, userId, dto);
  }

  /**
   * 删除文稿（软删除）
   */
  @Delete(':id')
  async deleteManuscript(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.deleteManuscript(id, userId);
  }

  /**
   * 创建卷
   */
  @Post('volumes')
  async createVolume(@Request() req: AuthenticatedRequest, @Body() dto: CreateVolumeDto) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.createVolume(dto, userId);
  }

  /**
   * 更新卷
   */
  @Put('volumes/:volumeId')
  async updateVolume(
    @Request() req: AuthenticatedRequest,
    @Param('volumeId', ParseIntPipe) volumeId: number,
    @Body() dto: UpdateVolumeDto
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.updateVolume(volumeId, dto, userId);
  }

  /**
   * 删除卷
   */
  @Delete('volumes/:volumeId')
  async deleteVolume(
    @Request() req: AuthenticatedRequest,
    @Param('volumeId', ParseIntPipe) volumeId: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.deleteVolume(volumeId, userId);
  }

  /**
   * 创建章节
   */
  @Post('chapters')
  async createChapter(@Request() req: AuthenticatedRequest, @Body() dto: CreateChapterDto) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.createChapter(dto, userId);
  }

  /**
   * 更新章节
   */
  @Put('chapters/:chapterId')
  async updateChapter(
    @Request() req: AuthenticatedRequest,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() dto: UpdateChapterDto
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.updateChapter(chapterId, dto, userId);
  }

  /**
   * 删除章节
   */
  @Delete('chapters/:chapterId')
  async deleteChapter(
    @Request() req: AuthenticatedRequest,
    @Param('chapterId', ParseIntPipe) chapterId: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.deleteChapter(chapterId, userId);
  }

  /**
   * 获取章节内容
   */
  @Get('chapters/:chapterId/content')
  async getChapterContent(
    @Request() req: AuthenticatedRequest,
    @Param('chapterId', ParseIntPipe) chapterId: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.getChapterContent(chapterId, userId);
  }

  /**
   * 保存章节内容
   */
  @Put('chapters/:chapterId/content')
  async saveChapterContent(
    @Request() req: AuthenticatedRequest,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() dto: SaveChapterContentDto
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.saveChapterContent(chapterId, dto, userId);
  }

  /**
   * 发布章节
   */
  @Post('chapters/:chapterId/publish')
  async publishChapter(
    @Request() req: AuthenticatedRequest,
    @Param('chapterId', ParseIntPipe) chapterId: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.publishChapter(chapterId, userId);
  }

  /**
   * 获取文稿设定
   */
  @Get(':id/settings')
  async getManuscriptSettings(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number
  ) {
    const userId = Number(req.user.id);
    return this.manuscriptsService.getManuscriptSettings(id, userId);
  }
}
