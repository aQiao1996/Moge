// src/schemas/signup.ts
import { z } from 'zod';
import { passwordValidation } from './login';

export const signupSchema = z
  .object({
    username: z.string().min(1, '账号不能为空'),
    password: passwordValidation, // 使用统一的密码验证规则
    confirm: z.string().min(1, '请再次输入密码'),
  })
  .refine((d) => d.password === d.confirm, {
    message: '两次密码不一致',
    path: ['confirm'],
  });

// =================================================================================
// Inferred Types
// =================================================================================

export type SignupData = z.infer<typeof signupSchema>;
