'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signupSchema, type SignupData } from '@moge/types';
import { useAuthStore } from '@/stores/authStore';
import { MogeInput } from '@/app/components/MogeInput';
import HookForm from '@/app/components/HookForm';
import { signIn } from 'next-auth/react';
import { registerApi } from '@/api/auth.api';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const { loading, resetError } = useAuthStore();

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: { username: '', password: '', confirm: '' },
  });

  const onSubmit = async (values: SignupData) => {
    toast.dismiss();
    resetError();

    await registerApi(values);
    toast.success('注册成功！正在为您登录...');

    const signInResult = await signIn('credentials', {
      username: values.username,
      password: values.password,
      redirect: false,
    });

    if (signInResult?.ok) {
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      toast.error(signInResult?.error || '自动登录失败, 请手动登录');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--moge-card-bg)',
        borderColor: 'var(--moge-card-border)',
        boxShadow: 'var(--moge-glow-card)',
      }}
      className="w-full max-w-md rounded-2xl border p-6 backdrop-blur-xl"
    >
      <h2 style={{ color: 'var(--moge-text-main)' }} className="text-center text-2xl font-bold">
        创建账户
      </h2>
      <p style={{ color: 'var(--moge-text-sub)' }} className="mt-1 text-center text-sm">
        注册后即可体验 AI 小说生成
      </p>

      <HookForm
        form={form}
        fields={[
          { name: 'username', label: '账号', required: true },
          { name: 'password', label: '密码', required: true },
          { name: 'confirm', label: '确认密码', required: true },
        ]}
        loading={loading}
        onSubmit={onSubmit}
        renderControl={(field, name) => (
          <MogeInput
            type={name === 'confirm' || name === 'password' ? 'password' : 'text'}
            placeholder={
              name === 'confirm'
                ? '再次输入密码'
                : name === 'password'
                  ? '请输入密码'
                  : '请输入账号'
            }
            {...field}
            autoComplete={name === 'username' ? 'username' : 'new-password'}
          />
        )}
        renderSubmitButton={({ loading: isLoading }) => (
          <Button
            type="submit"
            disabled={isLoading}
            className="from-moge-primary-400 to-moge-primary-500 hover:brightness-130 h-10 w-full rounded-md bg-gradient-to-r px-4 py-2 text-base text-white/90 shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              boxShadow:
                '0 10px 25px -5px var(--moge-glow-btn-color, rgba(56,189,248,.32)), 0 8px 10px -6px var(--moge-glow-btn-color, rgba(56,189,248,.22))',
            }}
          >
            {isLoading ? '注册中...' : '注册'}
          </Button>
        )}
      />

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--moge-text-muted)' }}>
        已有账户？
        <Link
          href="/login"
          style={{ color: 'var(--moge-link)' }}
          className="ml-1 hover:text-[var(--moge-link-hover)]"
        >
          立即登录
        </Link>
      </p>
    </div>
  );
}
