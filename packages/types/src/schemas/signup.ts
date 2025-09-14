// src/schemas/signup.ts
import { z } from 'zod';

export const signupSchema = z
  .object({
    username: z.string().min(1, '账号不能为空'),
    password: z.string().min(6, '密码至少 6 位'),
    confirm: z.string().min(1, '请再次输入密码'),
  })
  .refine((d) => d.password === d.confirm, {
    message: '两次密码不一致',
    path: ['confirm'],
  });

export type SignupValues = z.infer<typeof signupSchema>;
