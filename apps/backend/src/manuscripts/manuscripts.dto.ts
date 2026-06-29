import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
  Min,
  IsDateString,
  IsNumber,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AiCandidateApplyMode,
  AiContextLengthStrategy,
  ManuscriptStatus,
} from '../../generated/prisma';
import type { AIProvider } from '../ai/ai.service';

const AI_PROVIDER_VALUES = ['gemini', 'openai', 'moonshot', 'openai_compatible'] as const;

export class ManuscriptAiOverrideConfigDto {
  @IsOptional()
  @IsEnum(AI_PROVIDER_VALUES)
  provider?: AIProvider;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxTokens?: number;

  @IsOptional()
  @IsEnum(AiContextLengthStrategy)
  contextLengthStrategy?: AiContextLengthStrategy;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  defaultPresetId?: number;
}

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
 * 保存章节摘要 DTO
 */
export class SaveChapterSummaryDto {
  @IsString()
  summary: string;
}

/**
 * AI 续写 DTO
 */
export class AIContinueDto {
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ManuscriptAiOverrideConfigDto)
  overrideConfig?: ManuscriptAiOverrideConfigDto;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => ManuscriptAiOverrideConfigDto)
  overrideConfig?: ManuscriptAiOverrideConfigDto;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => ManuscriptAiOverrideConfigDto)
  overrideConfig?: ManuscriptAiOverrideConfigDto;
}

/**
 * AI 候选采纳 DTO
 */
export class ApplyAiCandidateDto {
  @IsEnum(AiCandidateApplyMode)
  mode: AiCandidateApplyMode;

  @IsOptional()
  @IsString()
  selectedText?: string;
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

/**
 * 定时发布章节 DTO
 */
export class ScheduleChapterPublishDto {
  @IsDateString()
  scheduledAt: string;
}
