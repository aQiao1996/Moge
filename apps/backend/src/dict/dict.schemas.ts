import { z } from 'zod';

export const DICT_SCOPE_VALUES = ['SYSTEM', 'USER', 'PROJECT'] as const;

export const dictListQuerySchema = z
  .object({
    type: z.string().min(1, '字典类型不能为空'),
    projectId: z.coerce.number().int().positive('项目 ID 必须大于 0').optional(),
    scope: z.enum(DICT_SCOPE_VALUES).optional(),
  })
  .strict();

export const dictCommunityQuerySchema = z
  .object({
    type: z.string().min(1, '字典类型不能为空').optional(),
  })
  .strict();

const dictItemRequestShape = {
  categoryCode: z.string().min(1, '请选择所属分类'),
  label: z.string().min(1, '请输入显示标签'),
  value: z.string().min(1, '请输入存储值'),
  sortOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
  description: z.string().optional(),
  scope: z.enum(DICT_SCOPE_VALUES).optional(),
  projectId: z.number().int().positive('项目 ID 必须大于 0').nullable().optional(),
};

export const createDictItemRequestSchema = z.object(dictItemRequestShape).strict();

export const updateDictItemRequestSchema = z.object(dictItemRequestShape).partial().strict();

export const toggleDictItemRequestSchema = z
  .object({
    isEnabled: z.boolean(),
  })
  .strict();

type DictScopeInput = (typeof DICT_SCOPE_VALUES)[number];

export type DictListQueryInput = z.infer<typeof dictListQuerySchema>;
export type DictCommunityQueryInput = z.infer<typeof dictCommunityQuerySchema>;
export interface CreateDictItemRequest {
  categoryCode: string;
  label: string;
  value: string;
  sortOrder?: number;
  isEnabled?: boolean;
  description?: string;
  scope?: DictScopeInput;
  projectId?: number | null;
}
export type UpdateDictItemRequest = Partial<CreateDictItemRequest>;
export type ToggleDictItemRequest = z.infer<typeof toggleDictItemRequestSchema>;
