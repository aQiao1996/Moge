import { z } from 'zod';

// ==================== Enums ====================
export const ManuscriptStatusEnum = z.enum([
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'PUBLISHED',
  'ABANDONED',
]);
export const ChapterStatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

export type ManuscriptStatus = z.infer<typeof ManuscriptStatusEnum>;
export type ChapterStatus = z.infer<typeof ChapterStatusEnum>;

// ==================== Create DTOs ====================
export const createManuscriptSchema = z.object({
  name: z.string().min(1, '请输入文稿名称'),
  description: z.string().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  outlineId: z.number().optional(),
  projectId: z.number().optional(),
  characters: z.array(z.string()).optional(),
  systems: z.array(z.string()).optional(),
  worlds: z.array(z.string()).optional(),
  misc: z.array(z.string()).optional(),
  targetWords: z.number().optional(),
  coverUrl: z.string().optional(),
});

export type CreateManuscriptValues = z.infer<typeof createManuscriptSchema>;

export const createVolumeSchema = z.object({
  manuscriptId: z.number(),
  title: z.string().min(1, '请输入卷名'),
  description: z.string().optional(),
});

export type CreateVolumeValues = z.infer<typeof createVolumeSchema>;

export const createChapterSchema = z.object({
  manuscriptId: z.number().optional(),
  volumeId: z.number().optional(),
  title: z.string().min(1, '请输入章节名'),
});

export type CreateChapterValues = z.infer<typeof createChapterSchema>;

// ==================== Update DTOs ====================
export const updateManuscriptSchema = createManuscriptSchema
  .extend({
    status: ManuscriptStatusEnum.optional(),
  })
  .partial();

export type UpdateManuscriptValues = z.infer<typeof updateManuscriptSchema>;

export const updateVolumeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateVolumeValues = z.infer<typeof updateVolumeSchema>;

export const updateChapterSchema = z.object({
  title: z.string().optional(),
});

export type UpdateChapterValues = z.infer<typeof updateChapterSchema>;

export const saveChapterContentSchema = z.object({
  content: z.string(),
});

export type SaveChapterContentValues = z.infer<typeof saveChapterContentSchema>;

// ==================== Entity Schemas ====================

// 章节内容
export const manuscriptChapterContentSchema = z.object({
  id: z.number(),
  chapterId: z.number(),
  content: z.string(),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ManuscriptChapterContent = z.infer<typeof manuscriptChapterContentSchema>;

// 章节
export const manuscriptChapterSchema = z.object({
  id: z.number(),
  manuscriptId: z.number().nullable().optional(),
  volumeId: z.number().nullable().optional(),
  title: z.string(),
  sortOrder: z.number(),
  wordCount: z.number(),
  status: ChapterStatusEnum,
  publishedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  content: manuscriptChapterContentSchema.nullable().optional(),
});

export type ManuscriptChapter = z.infer<typeof manuscriptChapterSchema>;

// 卷
export const manuscriptVolumeSchema = z.object({
  id: z.number(),
  manuscriptId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  sortOrder: z.number(),
  wordCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  chapters: z.array(manuscriptChapterSchema).optional(),
});

export type ManuscriptVolume = z.infer<typeof manuscriptVolumeSchema>;

// 文稿
export const manuscriptSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  tags: z.array(z.string()),
  status: ManuscriptStatusEnum,
  outlineId: z.number().nullable().optional(),
  projectId: z.number().nullable().optional(),
  characters: z.array(z.string()),
  systems: z.array(z.string()),
  worlds: z.array(z.string()),
  misc: z.array(z.string()),
  totalWords: z.number(),
  publishedWords: z.number(),
  targetWords: z.number().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  lastEditedChapterId: z.number().nullable().optional(),
  lastEditedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  userId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  volumes: z.array(manuscriptVolumeSchema).optional(),
  chapters: z.array(manuscriptChapterSchema).optional(),
});

export type Manuscript = z.infer<typeof manuscriptSchema>;

// 带完整结构的文稿
export const manuscriptWithStructureSchema = manuscriptSchema.extend({
  volumes: z.array(manuscriptVolumeSchema).default([]),
  chapters: z.array(manuscriptChapterSchema).default([]),
});

export type ManuscriptWithStructure = z.infer<typeof manuscriptWithStructureSchema>;

// 文稿设定
export const manuscriptSettingsSchema = z.object({
  characters: z.array(z.string()),
  systems: z.array(z.string()),
  worlds: z.array(z.string()),
  misc: z.array(z.string()),
});

export type ManuscriptSettings = z.infer<typeof manuscriptSettingsSchema>;
