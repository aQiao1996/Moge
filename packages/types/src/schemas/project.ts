import { z } from 'zod';

/**
 * 小说项目创建表单 Schema
 */
export const createProjectSchema = z.object({
  name: z
    .string({
      required_error: '项目名称不能为空',
      invalid_type_error: '项目名称不能为空',
    })
    .min(1, '项目名称不能为空')
    .max(50, '项目名称不能超过50个字符'),
  type: z
    .string({
      required_error: '请选择项目类型',
      invalid_type_error: '请选择项目类型',
    })
    .min(1, '请选择项目类型'),
  description: z.string().max(500, '项目描述不能超过500个字符').optional(),
  tags: z.array(z.string()).max(10, '标签不能超过10个').optional(),
  // 设定库关联字段，非必填
  characters: z.array(z.string()).max(50, '角色设定不能超过50个').optional(),
  systems: z.array(z.string()).max(20, '系统设定不能超过20个').optional(),
  worlds: z.array(z.string()).max(10, '世界设定不能超过10个').optional(),
  misc: z.array(z.string()).max(30, '辅助设定不能超过30个').optional(),
});

/**
 * 小说项目更新表单 Schema
 */
export const updateProjectSchema = createProjectSchema.partial();

export const aiProviderSchema = z.enum(['gemini', 'openai', 'moonshot', 'openai_compatible']);
export const aiContextLengthStrategySchema = z.enum(['COMPACT', 'BALANCED', 'EXPANDED']);
export const aiResultApplyStrategySchema = z.enum(['CANDIDATE', 'DIRECT_INSERT']);

export const projectAiConfigSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().min(1, '模型名称不能为空').max(100, '模型名称不能超过100个字符'),
  temperature: z.number().min(0, '温度不能小于0').max(2, '温度不能大于2'),
  maxTokens: z.number().int().min(1, '最大 token 必须大于0').max(200000, '最大 token 过大'),
  defaultContinuePresetId: z.number().int().positive().nullable().optional(),
  defaultPolishPresetId: z.number().int().positive().nullable().optional(),
  defaultExpandPresetId: z.number().int().positive().nullable().optional(),
  defaultOutlinePresetId: z.number().int().positive().nullable().optional(),
  enableCharacterContext: z.boolean(),
  enableSystemContext: z.boolean(),
  enableWorldContext: z.boolean(),
  enableMiscContext: z.boolean(),
  enableChapterSummaryContext: z.boolean(),
  enableProjectMemoryContext: z.boolean(),
  contextLengthStrategy: aiContextLengthStrategySchema,
  resultApplyStrategy: aiResultApplyStrategySchema,
  asyncTaskThreshold: z
    .number()
    .int()
    .min(0, '后台任务阈值不能小于0')
    .max(200000, '后台任务阈值过大'),
});

export const updateProjectAiConfigSchema = projectAiConfigSchema.partial().strict();

/**
 * 项目创建数据类型
 */
export type CreateProjectValues = z.infer<typeof createProjectSchema>;

/**
 * 项目更新数据类型
 */
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;

export type AIProviderValue = z.infer<typeof aiProviderSchema>;
export type AiContextLengthStrategyValue = z.infer<typeof aiContextLengthStrategySchema>;
export type AiResultApplyStrategyValue = z.infer<typeof aiResultApplyStrategySchema>;
export type ProjectAiConfigValues = z.infer<typeof projectAiConfigSchema>;
export type UpdateProjectAiConfigValues = z.infer<typeof updateProjectAiConfigSchema>;
