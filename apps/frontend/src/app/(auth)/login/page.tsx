/**
 * 登录页面组件
 *
 * 功能特性：
 * - 支持用户名/邮箱 + 密码登录
 * - 支持 GitLab OAuth 第三方登录
 * - 表单验证基于 Zod Schema
 * - 登录成功后跳转到首页
 * - 使用 NextAuth 进行认证管理
 */
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginSchema, type LoginData } from '@moge/types';
import { useAuthStore } from '@/stores/authStore';
import HookForm from '@/app/components/HookForm';
import { MogeInput } from '@/app/components/MogeInput';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiGitlab } from '@icons-pack/react-simple-icons';
import { signIn } from 'next-auth/react';

/**
 * LoginPage 组件
 * @returns 登录表单页面
 */
export default function LoginPage() {
  const router = useRouter();
  const { loading, resetError } = useAuthStore();

  // 初始化表单，使用 Zod 进行验证
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { username: '1424883981@qq.com', password: '0jdt001ar' },
  });

  /**
   * 处理表单提交
   * @param values - 登录表单数据
   */
  const onSubmit = async (values: LoginData) => {
    toast.dismiss();
    resetError();

    // 使用 NextAuth credentials 提供商进行登录
    const result = await signIn('credentials', {
      ...values,
      redirect: false,
    });

    if (result?.ok) {
      toast.success('登录成功');
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      toast.error(result?.error || '用户名或密码错误');
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
      {/* 页面标题 */}
      <h2 className="text-center text-2xl font-bold" style={{ color: 'var(--moge-text-main)' }}>
        欢迎回来
      </h2>
      <p className="mt-1 text-center text-sm" style={{ color: 'var(--moge-text-sub)' }}>
        登录后可体验 AI 小说生成
      </p>

      {/* 登录表单 */}
      <HookForm
        form={form}
        fields={[
          { name: 'username', label: '账号', required: true },
          { name: 'password', label: '密码', required: true },
        ]}
        loading={loading}
        onSubmit={onSubmit}
        renderControl={(field, name) =>
          name === 'username' ? (
            <MogeInput type="text" placeholder="用户名 / 邮箱" {...field} autoComplete="username" />
          ) : (
            <MogeInput
              type="password"
              placeholder="请输入密码"
              {...field}
              autoComplete="current-password"
            />
          )
        }
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
            {isLoading ? '登录中...' : '登录'}
          </Button>
        )}
      />

      {/* 分隔线 */}
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

      {/* GitLab OAuth 登录按钮 */}
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

      {/* 注册链接 */}
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
