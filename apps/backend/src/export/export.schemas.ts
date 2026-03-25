import { z } from 'zod';

export const exportChaptersBatchSchema = z
  .object({
    chapterIds: z
      .array(z.coerce.number().int().positive('章节 ID 必须大于 0'))
      .min(1, '至少选择一个章节'),
    format: z.enum(['txt', 'markdown']).optional(),
  })
  .strict();

export type ExportChaptersBatchInput = z.infer<typeof exportChaptersBatchSchema>;
