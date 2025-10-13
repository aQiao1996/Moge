'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MogeInput } from '@/app/components/MogeInput';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import HookForm from '@/app/components/HookForm';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordData,
  type ProfileValues,
} from '@moge/types';

/**
 * 个人中心页面组件
 *
 * 功能：
 * - 展示用户基本信息(头像、昵称、邮箱)
 * - 支持编辑个人信息(昵称、邮箱)
 * - 支持修改密码
 * - 修改密码成功后自动退出登录
 * - 加载状态使用 Skeleton 占位
 */
export default function ProfilePage() {
  const { update } = useSession();
  const user = useAuthStore((state) => state.user);
  const { updateProfile, changePassword, loading, resetError } = useUserStore();

  // 个人信息表单配置
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // 修改密码表单配置
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  /**
   * 处理个人信息提交
   * 更新成功后同步更新 session 数据
   */
  const handleProfileSubmit = async (values: ProfileValues) => {
    toast.dismiss();
    resetError();
    try {
      await updateProfile(values);
      await update({ ...values });
      toast.success('个人信息更新成功');
    } catch (error) {
      console.log('🚀 ~ page.tsx:46 ~ handleProfileSubmit ~ error:', error);
    }
  };

  /**
   * 处理密码修改提交
   * 修改成功后重置表单并自动退出登录
   */
  const handlePasswordSubmit = async (values: ChangePasswordData) => {
    toast.dismiss();
    resetError();
    try {
      await changePassword(values);
      toast.success('密码修改成功');
      passwordForm.reset();
      await signOut();
    } catch (error) {
      console.log('🚀 ~ page.tsx:57 ~ handlePasswordSubmit ~ error:', error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* 页面标题 */}
      <h1 className="font-han text-3xl font-bold text-[var(--moge-text-main)]">个人中心</h1>

      <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
        {/* 基本信息卡片 */}
        {user ? (
          <Card
            className="flex flex-col border p-6 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl text-[var(--moge-text-main)]">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-grow flex-col justify-between px-0">
              <div>
                {/* 用户头像和基本信息展示 */}
                <div className="mb-6 flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={user?.avatarUrl || 'https://github.com/shadcn.png'}
                      alt={user?.name || 'User Avatar'}
                    />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-semibold text-[var(--moge-text-main)]">
                      {user?.name}
                    </p>
                    <p className="text-sm text-[var(--moge-text-sub)]">{user?.email}</p>
                  </div>
                </div>
                <Separator className="my-6" style={{ backgroundColor: 'var(--moge-divider)' }} />
              </div>

              {/* 个人信息编辑表单 */}
              <HookForm
                form={profileForm}
                fields={[
                  { name: 'name', label: '用户昵称', required: true },
                  { name: 'email', label: '邮箱', required: true },
                ]}
                loading={loading}
                onSubmit={handleProfileSubmit}
                submitText="保存信息"
                submitButtonClassName="w-30"
                renderControl={(field, name) => (
                  <MogeInput
                    type={name === 'email' ? 'email' : 'text'}
                    placeholder={name === 'name' ? '请输入用户名' : '请输入邮箱'}
                    {...field}
                  />
                )}
              />
            </CardContent>
          </Card>
        ) : (
          // 基本信息加载骨架屏
          <Card
            className="flex flex-col border p-6 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl text-[var(--moge-text-main)]">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-grow flex-col justify-between px-0">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Separator className="my-6" style={{ backgroundColor: 'var(--moge-divider)' }} />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex justify-end pt-2">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 修改密码卡片 */}
        {user ? (
          <Card
            className="flex flex-col border p-6 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl text-[var(--moge-text-main)]">修改密码</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-grow flex-col justify-end px-0">
              {/* 修改密码表单 */}
              <HookForm
                form={passwordForm}
                fields={[
                  { name: 'currentPassword', label: '当前密码', required: true },
                  { name: 'newPassword', label: '新密码', required: true },
                  { name: 'confirmNewPassword', label: '确认新密码', required: true },
                ]}
                hiddenFields={[
                  { name: 'username', value: user.username, autoComplete: 'username' },
                ]}
                loading={loading}
                onSubmit={handlePasswordSubmit}
                submitText="修改密码"
                submitButtonClassName="w-30"
                renderControl={(field, name) => (
                  <MogeInput
                    type="password"
                    placeholder={
                      name === 'currentPassword'
                        ? '请输入当前密码'
                        : name === 'newPassword'
                          ? '请输入新密码'
                          : '请再次输入新密码'
                    }
                    {...field}
                    autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                  />
                )}
              />
            </CardContent>
          </Card>
        ) : (
          // 修改密码加载骨架屏
          <Card
            className="flex flex-col border p-6 backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--moge-card-bg)',
              borderColor: 'var(--moge-card-border)',
            }}
          >
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl text-[var(--moge-text-main)]">
                <Skeleton className="h-8 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-grow flex-col justify-end px-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex justify-end pt-2">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
