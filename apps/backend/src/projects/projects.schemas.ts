import { createProjectSchema } from '@moge/types';
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

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
export type UpdateProjectCharactersInput = z.infer<typeof updateProjectCharactersSchema>;
export type UpdateProjectSystemsInput = z.infer<typeof updateProjectSystemsSchema>;
export type UpdateProjectWorldsInput = z.infer<typeof updateProjectWorldsSchema>;
export type UpdateProjectMiscInput = z.infer<typeof updateProjectMiscSchema>;
