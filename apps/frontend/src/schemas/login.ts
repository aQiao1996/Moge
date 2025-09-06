// src/schemas/login.ts
import { z } from 'zod';

export const loginSchema = z.object({
  account: z.string().min(1, '账号不能为空'),
  password: z.string().min(6, '密码至少 6 位'),
});

export type LoginValues = z.infer<typeof loginSchema>;
