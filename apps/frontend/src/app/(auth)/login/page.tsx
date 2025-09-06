'use client';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SiGitlab } from '@icons-pack/react-simple-icons';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { loginSchema } from '@/schemas/login';
import { signIn } from 'next-auth/react';

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { account: '', password: '' },
  });

  const onSubmit = (values: LoginValues) => {
    console.log('🚀 ~ 提交字段:', values);
    setLoading(true);
    toast.success('提交成功');
    setTimeout(() => {
      setLoading(false);
      router.push('/');
    }, 1000);
  };

  // 校验失败时给 toast
  useEffect(() => {
    if (form.formState.isSubmitted && !form.formState.isValid) {
      toast.error('请修正表单错误');
    }
  }, [form.formState.isSubmitted, form.formState.isValid]);

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--moge-card-bg)',
          borderColor: 'var(--moge-card-border)',
          boxShadow: 'var(--moge-glow-card)',
        }}
        className="w-full max-w-md rounded-2xl border p-6 backdrop-blur-xl"
      >
        <h2 style={{ color: 'var(--moge-text-main)' }} className="text-center text-2xl font-bold">
          欢迎回来
        </h2>
        <p style={{ color: 'var(--moge-text-sub)' }} className="mt-1 text-center text-sm">
          登录后可体验 AI 小说生成
        </p>

        {/*  ===== 登录表单 =====  */}
        <Form {...form}>
          <form onSubmit={void form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {/* 账号 */}
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm" style={{ color: 'var(--moge-text-sub)' }}>
                    账号
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="account"
                      type="text"
                      placeholder="用户名 / 邮箱"
                      {...field}
                      className="input-moge mt-1 w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-400" />
                </FormItem>
              )}
            />

            {/* 密码 */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm" style={{ color: 'var(--moge-text-sub)' }}>
                    密码
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="请输入密码"
                      {...field}
                      className="input-moge mt-1 w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
                    />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="from-moge-primary-400 to-moge-primary-500 h-10 w-full bg-gradient-to-r text-base text-white/90 shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                boxShadow: `0 10px 25px -5px var(--moge-glow-btn-color, rgba(56,189,248,.32)), 0 8px 10px -6px var(--moge-glow-btn-color, rgba(56,189,248,.22))`,
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </Form>
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
    </>
  );
}
