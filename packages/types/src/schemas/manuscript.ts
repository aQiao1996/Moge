import { z } from 'zod';

// ==================== Enums ====================
export const ManuscriptStatusEnum = z.enum([
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'PUBLISHED',
  'ABANDONED',
]);
export const ChapterStatusEnum = z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']);

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

export const saveChapterSummarySchema = z.object({
  summary: z.string(),
});

export type SaveChapterSummaryValues = z.infer<typeof saveChapterSummarySchema>;

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

// 章节摘要
export const manuscriptChapterSummarySchema = z.object({
  id: z.number(),
  chapterId: z.number(),
  projectId: z.number().nullable().optional(),
  summary: z.string(),
  summaryType: z.string(),
  sourceVersion: z.number().nullable().optional(),
  generatedBy: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ManuscriptChapterSummary = z.infer<typeof manuscriptChapterSummarySchema>;

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
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  content: manuscriptChapterContentSchema.nullable().optional(),
  summary: manuscriptChapterSummarySchema.nullable().optional(),
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
export const manuscriptSettingItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  background: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const manuscriptSettingsSchema = z.object({
  characters: z.array(manuscriptSettingItemSchema),
  systems: z.array(manuscriptSettingItemSchema),
  worlds: z.array(manuscriptSettingItemSchema),
  misc: z.array(manuscriptSettingItemSchema),
});

export type ManuscriptSettings = z.infer<typeof manuscriptSettingsSchema>;

export const aiTaskTypeSchema = z.enum([
  'OUTLINE_GENERATE',
  'MANUSCRIPT_CONTINUE',
  'MANUSCRIPT_POLISH',
  'MANUSCRIPT_EXPAND',
  'CHAPTER_SUMMARIZE',
]);
export const aiPromptPresetScopeSchema = z.enum(['SYSTEM', 'USER', 'PROJECT']);
export const aiCandidateTypeSchema = z.enum(['TEXT']);
export const aiCandidateApplyModeSchema = z.enum([
  'INSERT_TAIL',
  'REPLACE_SELECTION',
  'OVERWRITE_DRAFT',
  'SAVE_AS_DRAFT',
]);
export const aiCandidateStatusSchema = z.enum(['PENDING', 'APPLIED', 'DISCARDED']);
export const aiJobStatusSchema = z.enum([
  'PENDING',
  'QUEUED',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'CANCELED',
  'PARTIAL_SUCCESS',
]);

export const aiContextSourceItemSchema = z.object({
  sourceType: z.string(),
  sourceId: z.union([z.string(), z.number()]).nullable().optional(),
  sourceName: z.string(),
  included: z.boolean(),
  reason: z.string(),
  contentPreview: z.string().nullable().optional(),
});

export const aiEffectiveConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number(),
  contextLengthStrategy: z.enum(['COMPACT', 'BALANCED', 'EXPANDED']),
  resultApplyStrategy: z.enum(['CANDIDATE', 'DIRECT_INSERT']),
  defaultPresetId: z.number().nullable().optional(),
});

export const aiTaskOverrideConfigSchema = z
  .object({
    provider: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
    contextLengthStrategy: z.enum(['COMPACT', 'BALANCED', 'EXPANDED']).optional(),
    defaultPresetId: z.number().int().positive().optional(),
  })
  .strict();

export const aiPromptPresetVersionSchema = z.object({
  id: z.number(),
  presetId: z.number(),
  version: z.number(),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  outputFormat: z.string().nullable().optional(),
  parameterSchema: z.unknown().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdBy: z.number().nullable().optional(),
  createdAt: z.string(),
});

export const aiPromptPresetSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  taskType: aiTaskTypeSchema,
  scope: aiPromptPresetScopeSchema,
  projectId: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  isSystemPreset: z.boolean(),
  isEnabled: z.boolean(),
  latestVersion: z.number(),
  createdBy: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  versions: z.array(aiPromptPresetVersionSchema).optional(),
});

export const aiGenerationRecordSchema = z.object({
  id: z.number(),
  jobId: z.number().nullable().optional(),
  projectId: z.number().nullable().optional(),
  taskType: aiTaskTypeSchema,
  provider: z.string(),
  model: z.string(),
  presetId: z.number().nullable().optional(),
  presetVersion: z.number().nullable().optional(),
  requestPayload: z.unknown().nullable().optional(),
  contextSnapshot: z.unknown().nullable().optional(),
  outputText: z.string().nullable().optional(),
  tokenUsage: z.unknown().nullable().optional(),
  latencyMs: z.number().nullable().optional(),
  status: z.string(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const aiJobEventSchema = z.object({
  id: z.number(),
  jobId: z.number(),
  eventType: z.string(),
  message: z.string().nullable().optional(),
  payload: z.unknown().nullable().optional(),
  createdAt: z.string(),
});

export const aiJobSchema = z.object({
  id: z.number(),
  userId: z.number(),
  projectId: z.number().nullable().optional(),
  outlineId: z.number().nullable().optional(),
  manuscriptId: z.number().nullable().optional(),
  chapterId: z.number().nullable().optional(),
  taskType: aiTaskTypeSchema,
  status: aiJobStatusSchema,
  priority: z.number(),
  provider: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  presetId: z.number().nullable().optional(),
  presetVersion: z.number().nullable().optional(),
  inputPayload: z.unknown().nullable().optional(),
  contextMeta: z.unknown().nullable().optional(),
  resultSummary: z.unknown().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  retryCount: z.number(),
  maxRetries: z.number(),
  nextRetryAt: z.string().nullable().optional(),
  lockedAt: z.string().nullable().optional(),
  lockedBy: z.string().nullable().optional(),
  heartbeatAt: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  events: z.array(aiJobEventSchema).optional(),
});

export const aiGenerationCandidateSchema = z.object({
  id: z.number(),
  generationRecordId: z.number(),
  projectId: z.number().nullable().optional(),
  outlineId: z.number().nullable().optional(),
  manuscriptId: z.number().nullable().optional(),
  chapterId: z.number().nullable().optional(),
  candidateType: aiCandidateTypeSchema,
  targetType: z.string(),
  targetId: z.number().nullable().optional(),
  targetContentVersion: z.number().nullable().optional(),
  expectedContentHash: z.string().nullable().optional(),
  content: z.string(),
  diffMeta: z.unknown().nullable().optional(),
  applyStatus: aiCandidateStatusSchema,
  appliedBy: z.number().nullable().optional(),
  appliedAt: z.string().nullable().optional(),
  applyMode: aiCandidateApplyModeSchema.nullable().optional(),
  appliedContentVersion: z.number().nullable().optional(),
  createdAt: z.string(),
});

export const aiGenerationResponseSchema = z.object({
  generationRecord: aiGenerationRecordSchema,
  candidate: aiGenerationCandidateSchema,
  effectiveConfig: aiEffectiveConfigSchema,
  contextSources: z.array(aiContextSourceItemSchema),
});

export const applyAiCandidateSchema = z.object({
  mode: aiCandidateApplyModeSchema,
  selectedText: z.string().optional(),
});

export type AiTaskType = z.infer<typeof aiTaskTypeSchema>;
export type AiPromptPresetScope = z.infer<typeof aiPromptPresetScopeSchema>;
export type AiCandidateType = z.infer<typeof aiCandidateTypeSchema>;
export type AiCandidateApplyMode = z.infer<typeof aiCandidateApplyModeSchema>;
export type AiCandidateStatus = z.infer<typeof aiCandidateStatusSchema>;
export type AiJobStatus = z.infer<typeof aiJobStatusSchema>;
export type AiContextSourceItem = z.infer<typeof aiContextSourceItemSchema>;
export type AiEffectiveConfig = z.infer<typeof aiEffectiveConfigSchema>;
export type AiTaskOverrideConfig = z.infer<typeof aiTaskOverrideConfigSchema>;
export type AiPromptPresetVersion = z.infer<typeof aiPromptPresetVersionSchema>;
export type AiPromptPreset = z.infer<typeof aiPromptPresetSchema>;
export type AiJobEvent = z.infer<typeof aiJobEventSchema>;
export type AiJob = z.infer<typeof aiJobSchema>;
export type AiGenerationRecord = z.infer<typeof aiGenerationRecordSchema>;
export type AiGenerationCandidate = z.infer<typeof aiGenerationCandidateSchema>;
export type AiGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;
export type ApplyAiCandidateValues = z.infer<typeof applyAiCandidateSchema>;
