import { z } from 'zod';

// =================================================================================
// User Profile Schemas
// =================================================================================

export const updateProfileSchema = z.object({
  name: z.string().min(1, '用户名不能为空').optional(),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  avatarUrl: z.string().url('头像URL格式不正确').optional().or(z.literal('')),
});

// 简化的profile schema (用于前端表单)
export const profileSchema = updateProfileSchema.pick({
  name: true,
  email: true,
});

// =================================================================================
// Inferred Types
// =================================================================================

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ProfileData = z.infer<typeof profileSchema>;

// =================================================================================
// 向后兼容的别名 (保持现有导入不中断)
// =================================================================================

export const updateProfileInputSchema = updateProfileSchema;

export type UpdateProfileInput = UpdateProfileData;
export type ProfileValues = ProfileData;
