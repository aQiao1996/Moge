'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import HookForm from '@/app/components/HookForm';
import { signupSchema, type SignupValues } from '@/schemas/signup';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: { account: '', password: '', confirm: '' },
  });

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
      {/* 表单 */}
      <HookForm
        form={form}
        fields={[
          { name: 'account', label: '账号' },
          { name: 'password', label: '密码' },
          { name: 'confirm', label: '确认密码' },
        ]}
        loading={loading}
        onSubmit={onSubmit}
        submitText="注册"
        renderControl={(field, name) => (
          <Input
            type={name === 'confirm' || name === 'password' ? 'password' : 'text'}
            placeholder={
              name === 'confirm'
                ? '再次输入密码'
                : name === 'password'
                  ? '请输入密码'
                  : '请输入账号'
            }
            {...field}
            className="input-moge w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--moge-input-ring)]"
          />
        )}
      />
      {/* 登录链接 */}
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
