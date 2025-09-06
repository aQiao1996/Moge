'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { signupSchema } from '@/schemas/signup';

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: { account: '', password: '', confirm: '' },
  });

  // 打印 + 跳转
  const onSubmit = (values: SignupValues) => {
    console.log('🚀 ~ 注册字段:', values);
    setLoading(true);
    toast.success('字段已打印，2 秒后跳转首页');
    setTimeout(() => {
      setLoading(false);
      router.push('/');
    }, 2000);
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
      {/* 注册表单   */}
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
                    placeholder="请输入账号"
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
          {/* 确认密码 */}
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm" style={{ color: 'var(--moge-text-sub)' }}>
                  确认密码
                </FormLabel>
                <FormControl>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="再次输入密码"
                    {...field}
                    className="input-moge mt-1 w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
                  />
                </FormControl>
                <FormMessage className="mt-1 text-xs text-red-400" />
              </FormItem>
            )}
          />
          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={loading}
            className="from-moge-primary-400 to-moge-primary-500 h-10 w-full bg-gradient-to-r text-base text-white/90 shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              boxShadow: `0 10px 25px -5px var(--moge-glow-btn-color, rgba(56,189,248,.32)), 0 8px 10px -6px var(--moge-glow-btn-color, rgba(56,189,248,.22))`,
            }}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>
      </Form>
      {/* 登录提示 */}
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
