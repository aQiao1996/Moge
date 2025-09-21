import { z } from 'zod';

export const outlineContentSchema = z.object({
  id: z.string(),
  outlineId: z.string(),
  content: z.string().default(''),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string().default(''),
        order: z.number(),
        parentId: z.string().nullable().default(null),
      })
    )
    .default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OutlineContent = z.infer<typeof outlineContentSchema>;

export const createOutlineContentSchema = z.object({
  content: z.string().default(''),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string().default(''),
        order: z.number(),
        parentId: z.string().nullable().default(null),
      })
    )
    .default([]),
});

export type CreateOutlineContentValues = z.infer<typeof createOutlineContentSchema>;

export const updateOutlineContentSchema = createOutlineContentSchema.partial();

export type UpdateOutlineContentValues = z.infer<typeof updateOutlineContentSchema>;
