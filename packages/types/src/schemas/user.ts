import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, '用户名不能为空').optional(),
  email: z.email('请输入有效的邮箱地址').optional().or(z.literal('')),
  avatarUrl: z.url('头像URL格式不正确').optional().or(z.literal('')),
});
