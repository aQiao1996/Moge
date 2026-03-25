import { z } from 'zod';

const titleSchema = z.string().trim().min(1, '标题不能为空');
const optionalTextSchema = z.string().optional();
const relationIdsSchema = z.array(z.coerce.number().int().positive('设定 ID 必须大于 0'));

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
export type OutlineVolumeInput = z.infer<typeof outlineVolumeSchema>;
export type OutlineChapterInput = z.infer<typeof outlineChapterSchema>;
export type UpdateOutlineCharactersInput = z.infer<typeof updateOutlineCharactersSchema>;
export type UpdateOutlineSystemsInput = z.infer<typeof updateOutlineSystemsSchema>;
export type UpdateOutlineWorldsInput = z.infer<typeof updateOutlineWorldsSchema>;
export type UpdateOutlineMiscInput = z.infer<typeof updateOutlineMiscSchema>;
