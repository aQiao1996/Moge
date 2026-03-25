import { z } from 'zod';

export const outlineContentSchema = z.object({
  id: z.string(),
  outlineId: z.string(),
  content: z.string().default(''),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OutlineContent = z.infer<typeof outlineContentSchema>;

export const createOutlineContentSchema = z.object({
  content: z.string().default(''),
});

export type CreateOutlineContentValues = z.infer<typeof createOutlineContentSchema>;

export const updateOutlineContentSchema = createOutlineContentSchema.partial();

export type UpdateOutlineContentValues = z.infer<typeof updateOutlineContentSchema>;
