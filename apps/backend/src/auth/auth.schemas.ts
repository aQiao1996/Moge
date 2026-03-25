import { z } from 'zod';

export const gitlabLoginSchema = z
  .object({
    provider: z.string().min(1, 'provider 不能为空'),
    providerAccountId: z.string().min(1, 'providerAccountId 不能为空'),
    email: z.string().email('邮箱格式不正确'),
    name: z.string().optional(),
    avatarUrl: z.string().url('头像地址格式不正确').optional(),
  })
  .strict();

export type GitlabLoginData = z.infer<typeof gitlabLoginSchema>;
