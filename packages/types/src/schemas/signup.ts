// src/schemas/signup.ts
import { z } from 'zod';

export const signupSchema = z
  .object({
    username: z.string().min(2, '用户名至少需要 2 个字符'),
    password: z.string().min(6, '密码至少需要 6 个字符'),
    confirm: z.string(),
    email: z.string().email('请输入有效的邮箱地址').optional(),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm, {
    message: '两次输入的密码不一致',
    path: ['confirm'],
  });

export type SignupData = z.infer<typeof signupSchema>;
