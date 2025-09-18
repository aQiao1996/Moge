// src/schemas/login.ts
import { z } from 'zod';

// =================================================================================
// 统一密码校验规则
// =================================================================================
export const passwordValidation = z
  .string()
  .min(8, '密码至少为8位')
  .regex(/^(?=.*[A-Za-z])(?=.*\d)/, '密码必须同时包含英文和数字');

// =================================================================================
// Auth Schemas
// =================================================================================

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'), // 登录时不限制密码格式,只在注册和修改时限制
});

export const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3位').max(20, '用户名不超过20位'),
  password: passwordValidation,
  email: z.string().email('邮箱格式不正确').optional(),
  name: z.string().max(50, '昵称不超过50位').optional(),
});

export const gitlabLoginSchema = z.object({
  provider: z.string(),
  providerAccountId: z.string(),
  email: z.string().email('邮箱格式不正确').optional(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '当前密码不能为空'),
    newPassword: passwordValidation,
    confirmNewPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmNewPassword'],
  });

// 前端用的简化密码修改schema (向后兼容profile.ts)
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '当前密码不能为空'),
    newPassword: z.string().min(6, '新密码至少6位'),
    confirmNewPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmNewPassword'],
  });

// =================================================================================
// Inferred Types
// =================================================================================
// 把 zod 校验模式 loginSchema 自动推导成 ts 类型 (保持向后兼容)
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type GitlabLoginData = z.infer<typeof gitlabLoginSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type PasswordData = z.infer<typeof passwordSchema>;
