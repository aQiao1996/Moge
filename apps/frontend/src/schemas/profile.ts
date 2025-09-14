import { updateProfileSchema } from '@/schemas/user';
import { z } from 'zod';

export const profileSchema = updateProfileSchema.pick({
  name: true,
  email: true,
});

export type ProfileValues = z.infer<typeof profileSchema>;

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

export type PasswordValues = z.infer<typeof passwordSchema>;
