'use client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import HookForm from '@/app/components/HookForm';
import { toast } from 'sonner';
import { trpcClient } from '@/lib/trpc';
import { useAuthStore } from '@/stores/authStore';
import {
  passwordSchema,
  profileSchema,
  type PasswordValues,
  type ProfileValues,
} from '@/schemas/profile';

export default function ProfilePage() {
  const { update } = useSession();
  const user = useAuthStore((state) => state.user);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const handleProfileSubmit = async (values: ProfileValues) => {
    setIsProfileLoading(true);
    toast.dismiss();
    try {
      await trpcClient.user.updateProfile.mutate(values);
      await update({ name: values.name, email: values.email });
      toast.success('个人信息更新成功');
    } catch (error) {
      toast.error('更新个人信息失败');
      console.error('Failed to update profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordValues) => {
    setIsPasswordLoading(true);
    toast.dismiss();
    try {
      await trpcClient.auth.changePassword.mutate(values);
      toast.success('密码修改成功');
      passwordForm.reset();
    } catch (error) {
      console.log('🚀 ~ page.tsx:87 ~ handlePasswordSubmit ~ error:', error);
      toast.error('修改密码失败');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="font-han text-3xl font-bold text-[var(--moge-text-main)]">个人中心</h1>
      <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
        {/* 个人信息卡片 */}
        <Card
          className="flex flex-col border p-6 backdrop-blur-xl"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl text-[var(--moge-text-main)]">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col justify-between px-0">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user?.avatarUrl || 'https://github.com/shadcn.png'}
                    alt={user?.name || 'User Avatar'}
                  />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold text-[var(--moge-text-main)]">{user?.name}</p>
                  <p className="text-sm text-[var(--moge-text-sub)]">{user?.email}</p>
                </div>
              </div>
              <Separator className="my-6" style={{ backgroundColor: 'var(--moge-divider)' }} />
            </div>
            <HookForm
              form={profileForm}
              fields={[
                { name: 'name', label: '用户名', required: true },
                { name: 'email', label: '邮箱' },
              ]}
              loading={isProfileLoading}
              onSubmit={handleProfileSubmit}
              submitText="保存信息"
              submitButtonClassName="w-30"
              renderControl={(field, name) => (
                <Input
                  type={name === 'email' ? 'email' : 'text'}
                  placeholder={name === 'name' ? '请输入用户名' : '请输入邮箱'}
                  {...field}
                  className="input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 修改密码卡片 */}
        <Card
          className="flex flex-col border p-6 backdrop-blur-xl"
          style={{ backgroundColor: 'var(--moge-card-bg)', borderColor: 'var(--moge-card-border)' }}
        >
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl text-[var(--moge-text-main)]">修改密码</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col justify-end px-0">
            <HookForm
              form={passwordForm}
              fields={[
                { name: 'currentPassword', label: '当前密码', required: true },
                { name: 'newPassword', label: '新密码', required: true },
                { name: 'confirmNewPassword', label: '确认新密码', required: true },
              ]}
              loading={isPasswordLoading}
              onSubmit={handlePasswordSubmit}
              submitText="修改密码"
              submitButtonClassName="w-30"
              renderControl={(field, name) => (
                <Input
                  type="password"
                  placeholder={
                    name === 'currentPassword'
                      ? '请输入当前密码'
                      : name === 'newPassword'
                        ? '请输入新密码'
                        : '请再次输入新密码'
                  }
                  {...field}
                  className="input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
                />
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
