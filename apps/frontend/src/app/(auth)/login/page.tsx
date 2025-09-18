'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginSchema, type LoginData } from '@moge/types';
import { useAuthStore } from '@/stores/auth.store';
import HookForm from '@/app/components/HookForm';
import { MogeInput } from '@/app/components/MogeInput';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiGitlab } from '@icons-pack/react-simple-icons';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const { loading, resetError } = useAuthStore();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginData) => {
    toast.dismiss();
    resetError();

    const result = await signIn('credentials', {
      ...values,
      redirect: false,
    });

    if (result?.ok) {
      toast.success('登录成功');
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
      <h2 className="text-center text-2xl font-bold" style={{ color: 'var(--moge-text-main)' }}>
        欢迎回来
      </h2>
      <p className="mt-1 text-center text-sm" style={{ color: 'var(--moge-text-sub)' }}>
        登录后可体验 AI 小说生成
      </p>

      <HookForm
        form={form}
        fields={[
          { name: 'username', label: '账号', required: true },
          { name: 'password', label: '密码', required: true },
        ]}
        loading={loading}
        onSubmit={onSubmit}
        submitText="登录"
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
      />

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
