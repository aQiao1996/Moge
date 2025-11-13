import { IsString, IsOptional, IsArray, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ManuscriptStatus } from '../../generated/prisma';

/**
 * 创建文稿 DTO
 */
export class CreateManuscriptDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  outlineId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characters?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  systems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  worlds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  misc?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  targetWords?: number;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}

/**
 * 更新文稿 DTO
 */
export class UpdateManuscriptDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ManuscriptStatus)
  status?: ManuscriptStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characters?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  systems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  worlds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  misc?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  targetWords?: number;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}

/**
 * 创建卷 DTO
 */
export class CreateVolumeDto {
  @IsInt()
  @Type(() => Number)
  manuscriptId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 更新卷 DTO
 */
export class UpdateVolumeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 创建章节 DTO
 */
export class CreateChapterDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  manuscriptId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  volumeId?: number;

  @IsString()
  title: string;
}

/**
 * 更新章节 DTO
 */
export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  title?: string;
}

/**
 * 保存章节内容 DTO
 */
export class SaveChapterContentDto {
  @IsString()
  content: string;
}

/**
 * AI 续写 DTO
 */
export class AIContinueDto {
  @IsOptional()
  @IsString()
  customPrompt?: string;
}

/**
 * AI 润色 DTO
 */
export class AIPolishDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  customPrompt?: string;
}

/**
 * AI 扩写 DTO
 */
export class AIExpandDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  customPrompt?: string;
}

/**
 * 批量更新卷排序 DTO
 */
export class ReorderVolumesDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  volumeIds: number[];
}

/**
 * 批量更新章节排序 DTO
 */
export class ReorderChaptersDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  chapterIds: number[];
}

/**
 * 批量发布章节 DTO
 */
export class BatchPublishChaptersDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  chapterIds: number[];
}
