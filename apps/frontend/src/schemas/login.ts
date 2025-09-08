// src/schemas/login.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, '账号不能为空'),
  password: z.string().min(6, '密码至少 6 位'),
});

// 把 zod 校验模式 loginSchema 自动推导成 ts 类型
export type LoginValues = z.infer<typeof loginSchema>;
