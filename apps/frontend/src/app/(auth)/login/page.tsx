'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import HookForm from '@/app/components/HookForm';
import { loginSchema, type LoginValues } from '@moge/types';
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiGitlab } from '@icons-pack/react-simple-icons';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    toast.dismiss();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        ...values,
        redirect: false, // 设置为 false, signIn 不会自动跳转, 而是返回一个结果对象
      });

      if (result?.ok) {
        toast.success('登录成功');
        setTimeout(() => router.push('/'), 1000);
      } else {
        toast.error(result?.error || '用户名或密码错误');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md rounded-2xl border p-6 backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--moge-card-bg)',
        borderColor: 'var(--moge-card-border)',
        boxShadow: 'var(--moge-glow-card)',
      }}
    >
      <h2 className="text-center text-2xl font-bold" style={{ color: 'var(--moge-text-main)' }}>
        欢迎回来
      </h2>
      <p className="mt-1 text-center text-sm" style={{ color: 'var(--moge-text-sub)' }}>
        登录后可体验 AI 小说生成
      </p>

      {/* 表单 */}
      <HookForm
        form={form}
        fields={[
          { name: 'username', label: '账号', required: true },
          { name: 'password', label: '密码', required: true },
        ]}
        loading={isLoading}
        onSubmit={onSubmit}
        submitText="登录"
        renderControl={(field, name) =>
          name === 'username' ? (
            <Input
              type="text"
              placeholder="用户名 / 邮箱"
              {...field}
              className="input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
            />
          ) : (
            <Input
              type="password"
              placeholder="请输入密码"
              {...field}
              className="input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
            />
          )
        }
      />
      {/* ===== 或 ===== */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div style={{ borderColor: 'var(--moge-divider)' }} className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span style={{ color: 'var(--moge-text-muted)' }} className="px-2">
            Or
          </span>
        </div>
      </div>
      {/* ===== GitLab 登录 ===== */}
      <Button
        onClick={() => void signIn('gitlab', { callbackUrl: '/' })}
        style={{
          borderColor: 'var(--moge-card-border)',
          background:
            'linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.1))',
          color: 'var(--moge-text-main)',
        }}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-base transition-all duration-300 hover:shadow-lg"
      >
        <SiGitlab className="h-5 w-5" fill="currentColor" />
        使用 GitLab 登录
      </Button>
      {/* ===== 注册 ===== */}
      <p className="mt-4 text-center text-sm" style={{ color: 'var(--moge-text-muted)' }}>
        还没有账户？
        <Link
          href="/signup"
          style={{ color: 'var(--moge-link)' }}
          className="ml-1 hover:text-[var(--moge-link-hover)]"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
