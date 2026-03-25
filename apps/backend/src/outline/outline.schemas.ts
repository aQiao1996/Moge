import { createOutlineSchema, updateOutlineSchema } from '@moge/types';
import { z } from 'zod';

const titleSchema = z.string().trim().min(1, '标题不能为空');
const optionalTextSchema = z.string().optional();
const relationIdsSchema = z.array(z.coerce.number().int().positive('设定 ID 必须大于 0'));
const queryTagsSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  });

export const OUTLINE_STATUS_VALUES = [
  'DRAFT',
  'GENERATING',
  'GENERATED',
  'PUBLISHED',
  'DISCARDED',
] as const;

export const OUTLINE_SORT_BY_VALUES = ['name', 'createdAt', 'type'] as const;
export const OUTLINE_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

export const createOutlineRequestSchema = createOutlineSchema.strict();
export const updateOutlineRequestSchema = updateOutlineSchema.strict();
export const outlineListQuerySchema = z
  .object({
    pageNum: z.coerce.number().int().min(1, '页码必须大于 0').optional(),
    pageSize: z.coerce
      .number()
      .int()
      .min(1, '每页条数必须大于 0')
      .max(100, '每页条数不能超过 100')
      .optional(),
    search: z.string().optional(),
    type: z.string().optional(),
    era: z.string().optional(),
    status: z.enum(OUTLINE_STATUS_VALUES).optional(),
    tags: queryTagsSchema,
    sortBy: z.enum(OUTLINE_SORT_BY_VALUES).optional(),
    sortOrder: z.enum(OUTLINE_SORT_ORDER_VALUES).optional(),
  })
  .strict();

export const updateOutlineContentSchema = z
  .object({
    content: z.string(),
  })
  .strict();

export const outlineVolumeSchema = z
  .object({
    title: titleSchema,
    description: optionalTextSchema,
  })
  .strict();

export const outlineChapterSchema = z
  .object({
    title: titleSchema,
    content: optionalTextSchema,
  })
  .strict();

export const updateOutlineCharactersSchema = z
  .object({
    characters: relationIdsSchema,
  })
  .strict();

export const updateOutlineSystemsSchema = z
  .object({
    systems: relationIdsSchema,
  })
  .strict();

export const updateOutlineWorldsSchema = z
  .object({
    worlds: relationIdsSchema,
  })
  .strict();

export const updateOutlineMiscSchema = z
  .object({
    misc: relationIdsSchema,
  })
  .strict();

export type UpdateOutlineContentInput = z.infer<typeof updateOutlineContentSchema>;
export type CreateOutlineRequestInput = z.infer<typeof createOutlineRequestSchema>;
export type UpdateOutlineRequestInput = z.infer<typeof updateOutlineRequestSchema>;
export type OutlineListQueryInput = z.infer<typeof outlineListQuerySchema>;
export type OutlineVolumeInput = z.infer<typeof outlineVolumeSchema>;
export type OutlineChapterInput = z.infer<typeof outlineChapterSchema>;
export type UpdateOutlineCharactersInput = z.infer<typeof updateOutlineCharactersSchema>;
export type UpdateOutlineSystemsInput = z.infer<typeof updateOutlineSystemsSchema>;
export type UpdateOutlineWorldsInput = z.infer<typeof updateOutlineWorldsSchema>;
export type UpdateOutlineMiscInput = z.infer<typeof updateOutlineMiscSchema>;
