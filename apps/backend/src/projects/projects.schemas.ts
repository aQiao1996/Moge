import {
  aiTaskTypeSchema,
  createProjectSchema,
  projectMemberRoleSchema,
  updateProjectAiConfigSchema,
} from '@moge/types';
import { z } from 'zod';

const relationIdSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+$/.test(value), '设定 ID 必须是正整数');

const relationIdsUpdateSchema = z
  .array(z.coerce.number().int().positive('设定 ID 必须大于 0'))
  .max(100, '设定数量过多');

export const createProjectRequestSchema = createProjectSchema
  .extend({
    characters: z.array(relationIdSchema).max(50, '角色设定不能超过50个').optional(),
    systems: z.array(relationIdSchema).max(20, '系统设定不能超过20个').optional(),
    worlds: z.array(relationIdSchema).max(10, '世界设定不能超过10个').optional(),
    misc: z.array(relationIdSchema).max(30, '辅助设定不能超过30个').optional(),
  })
  .strict();

export const updateProjectRequestSchema = createProjectRequestSchema.partial();

export const updateProjectCharactersSchema = z
  .object({
    characterIds: relationIdsUpdateSchema,
  })
  .strict();

export const updateProjectSystemsSchema = z
  .object({
    systemIds: relationIdsUpdateSchema,
  })
  .strict();

export const updateProjectWorldsSchema = z
  .object({
    worldIds: relationIdsUpdateSchema,
  })
  .strict();

export const updateProjectMiscSchema = z
  .object({
    miscIds: relationIdsUpdateSchema,
  })
  .strict();

export const updateProjectAiConfigRequestSchema = updateProjectAiConfigSchema;

const promptPresetVersionPayloadSchema = z
  .object({
    systemPrompt: z.string().min(1, '系统提示词不能为空'),
    userPromptTemplate: z.string().min(1, '用户提示词模板不能为空'),
    outputFormat: z.string().max(50).optional(),
    parameterSchema: z.unknown().optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const createProjectPromptPresetRequestSchema = promptPresetVersionPayloadSchema
  .extend({
    code: z
      .string()
      .min(1, '预设编码不能为空')
      .max(80, '预设编码不能超过80个字符')
      .regex(/^[a-z0-9_-]+$/, '预设编码只能包含小写字母、数字、下划线和短横线'),
    name: z.string().min(1, '预设名称不能为空').max(80, '预设名称不能超过80个字符'),
    taskType: aiTaskTypeSchema,
    description: z.string().max(500).optional(),
  })
  .strict();

export const updateProjectPromptPresetRequestSchema = z
  .object({
    code: z
      .string()
      .min(1, '预设编码不能为空')
      .max(80, '预设编码不能超过80个字符')
      .regex(/^[a-z0-9_-]+$/, '预设编码只能包含小写字母、数字、下划线和短横线')
      .optional(),
    name: z.string().min(1, '预设名称不能为空').max(80, '预设名称不能超过80个字符').optional(),
    description: z.string().max(500).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, '至少需要提供一个更新字段');

export const appendProjectPromptPresetVersionRequestSchema = promptPresetVersionPayloadSchema;

export const addProjectMemberRequestSchema = z
  .object({
    userId: z.coerce.number().int().positive('用户 ID 必须大于 0'),
    role: projectMemberRoleSchema.exclude(['OWNER']),
  })
  .strict();

export const updateProjectMemberRequestSchema = z
  .object({
    role: projectMemberRoleSchema.exclude(['OWNER']),
  })
  .strict();

export const createProjectMemoryItemRequestSchema = z
  .object({
    category: z.string().min(1, '分类不能为空').max(50, '分类不能超过50个字符'),
    title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符'),
    content: z.string().min(1, '内容不能为空').max(5000, '内容不能超过5000个字符'),
    priority: z.coerce.number().int().min(0).max(100).optional(),
    sourceType: z.string().min(1).max(50).optional(),
    sourceId: z.coerce.number().int().positive().nullable().optional(),
  })
  .strict();

export const updateProjectMemoryItemRequestSchema = createProjectMemoryItemRequestSchema.partial();

export const createProjectKnowledgeDocumentRequestSchema = z
  .object({
    title: z.string().min(1, '标题不能为空').max(120, '标题不能超过120个字符'),
    documentType: z.string().min(1, '资料类型不能为空').max(50, '资料类型不能超过50个字符'),
    content: z.string().min(1, '内容不能为空').max(50000, '内容不能超过50000个字符'),
    source: z.string().min(1).max(100).optional(),
  })
  .strict();

export const updateProjectKnowledgeDocumentRequestSchema =
  createProjectKnowledgeDocumentRequestSchema.partial();

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
export type UpdateProjectCharactersInput = z.infer<typeof updateProjectCharactersSchema>;
export type UpdateProjectSystemsInput = z.infer<typeof updateProjectSystemsSchema>;
export type UpdateProjectWorldsInput = z.infer<typeof updateProjectWorldsSchema>;
export type UpdateProjectMiscInput = z.infer<typeof updateProjectMiscSchema>;
export type UpdateProjectAiConfigInput = z.infer<typeof updateProjectAiConfigRequestSchema>;
export type CreateProjectPromptPresetInput = z.infer<typeof createProjectPromptPresetRequestSchema>;
export type UpdateProjectPromptPresetInput = z.infer<typeof updateProjectPromptPresetRequestSchema>;
export type AppendProjectPromptPresetVersionInput = z.infer<
  typeof appendProjectPromptPresetVersionRequestSchema
>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberRequestSchema>;
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberRequestSchema>;
export type CreateProjectMemoryItemInput = z.infer<typeof createProjectMemoryItemRequestSchema>;
export type UpdateProjectMemoryItemInput = z.infer<typeof updateProjectMemoryItemRequestSchema>;
export type CreateProjectKnowledgeDocumentInput = z.infer<
  typeof createProjectKnowledgeDocumentRequestSchema
>;
export type UpdateProjectKnowledgeDocumentInput = z.infer<
  typeof updateProjectKnowledgeDocumentRequestSchema
>;
