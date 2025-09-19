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
  status: z.enum(['DRAFT', 'PUBLISHED', 'DISCARDED']),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Outline = z.infer<typeof outlineSchema>;
