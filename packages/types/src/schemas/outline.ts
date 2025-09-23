import { z } from 'zod';

export const createOutlineSchema = z.object({
  name: z.string().min(1, '请输入小说名称'),
  type: z.string().min(1, '请选择小说类型'),
  era: z.string().optional(),
  conflict: z.string().optional(),
  tags: z.array(z.string()).optional(),
  remark: z.string().optional(),
});

export type CreateOutlineValues = z.infer<typeof createOutlineSchema>;

export const outlineSchema = createOutlineSchema.extend({
  id: z.string(),
  status: z.enum(['DRAFT', 'GENERATING', 'GENERATED', 'PUBLISHED', 'DISCARDED']),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Outline = z.infer<typeof outlineSchema>;

// 卷的 schema
export const outlineVolumeSchema = z.object({
  id: z.string(),
  outlineId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OutlineVolume = z.infer<typeof outlineVolumeSchema>;

// 章节内容的 schema
export const outlineChapterContentSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  content: z.string(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OutlineChapterContent = z.infer<typeof outlineChapterContentSchema>;

// 章节的 schema
export const outlineChapterSchema = z.object({
  id: z.string(),
  outlineId: z.string().nullable().optional(),
  volumeId: z.string().nullable().optional(),
  title: z.string(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  content: outlineChapterContentSchema.nullable().optional(),
});

export type OutlineChapter = z.infer<typeof outlineChapterSchema>;

// 带章节的卷
export const outlineVolumeWithChaptersSchema = outlineVolumeSchema.extend({
  chapters: z.array(outlineChapterSchema).default([]),
});

export type OutlineVolumeWithChapters = z.infer<typeof outlineVolumeWithChaptersSchema>;

// 完整的大纲结构
export const outlineWithStructureSchema = outlineSchema.extend({
  content: z
    .object({
      id: z.string(),
      outlineId: z.string(),
      content: z.string(),
      version: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .nullable()
    .optional(),
  volumes: z.array(outlineVolumeWithChaptersSchema).default([]),
  chapters: z.array(outlineChapterSchema).default([]), // 无卷的直接章节
});

export type OutlineWithStructure = z.infer<typeof outlineWithStructureSchema>;

export const updateOutlineSchema = createOutlineSchema
  .extend({
    status: z.enum(['DRAFT', 'GENERATING', 'GENERATED', 'PUBLISHED', 'DISCARDED']).optional(),
  })
  .partial(); // 所有字段都可选

export type UpdateOutlineValues = z.infer<typeof updateOutlineSchema>;
