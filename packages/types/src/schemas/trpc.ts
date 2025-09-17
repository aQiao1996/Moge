import { z } from 'zod';

// =================================================================================
// 统一密码校验规则
// =================================================================================
const passwordValidation = z
  .string()
  .min(8, '密码至少为8位')
  .regex(/^(?=.*[A-Za-z])(?=.*\d)/, '密码必须同时包含英文和数字');

// =================================================================================
// Auth Schemas
// =================================================================================

export const loginInputSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'), // 登录时不限制密码格式,只在注册和修改时限制
});

export const registerInputSchema = z.object({
  username: z.string().min(3, '用户名至少3位').max(20, '用户名不超过20位'),
  password: passwordValidation,
  email: z.string().email('邮箱格式不正确').optional(),
  name: z.string().max(50, '昵称不超过50位').optional(),
});

export const gitlabLoginInputSchema = z.object({
  provider: z.string(),
  providerAccountId: z.string(),
  email: z.string().email('邮箱格式不正确').optional(),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, '当前密码不能为空'),
    newPassword: passwordValidation,
    confirmNewPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmNewPassword'],
  });

// =================================================================================
// User Schemas
// =================================================================================

export const updateProfileInputSchema = z.object({
  name: z.string().min(1, '用户名不能为空').optional(),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  avatarUrl: z.string().url('头像URL格式不正确').optional().or(z.literal('')),
});

// =================================================================================
// Inferred Types
// =================================================================================

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type GitlabLoginInput = z.infer<typeof gitlabLoginInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
