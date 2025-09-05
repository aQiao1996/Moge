'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SiGitlab } from '@icons-pack/react-simple-icons';

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDesc, setDialogDesc] = useState('');

  const handleCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) return;
    setLoading(true);
    const res = await signIn('credentials', {
      redirect: false,
      account,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      setDialogTitle('登录成功');
      setDialogDesc('即将跳转到首页...');
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
        router.push('/');
      }, 1200);
    } else {
      setDialogTitle('登录失败');
      setDialogDesc(res?.error || '账号或密码错误');
      setOpen(true);
    }
  };

  return (
    <>
      {/* 卡片容器 - 变量化颜色 */}
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

        {/* 账号密码登录 */}
        <form onSubmit={void handleCredential} className="mt-5 space-y-4">
          <div>
            <label style={{ color: 'var(--moge-text-sub)' }} className="block text-sm">
              账号
            </label>
            <input
              id="account"
              type="text"
              placeholder="用户名 / 邮箱"
              required
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="input-moge mt-1 w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
            />
          </div>

          <div>
            <label style={{ color: 'var(--moge-text-sub)' }} className="block text-sm">
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-moge mt-1 w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{
              background:
                'linear-gradient(to right, var(--moge-primary-400), var(--moge-primary-500))',
              boxShadow: 'var(--moge-glow-btn)',
            }}
            className="h-10 w-full cursor-pointer text-base text-white/90 shadow-lg disabled:opacity-60"
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        {/* 分割线 */}
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

        {/* GitLab 登录 */}
        <button
          onClick={() => void signIn('gitlab', { callbackUrl: '/' })}
          style={{
            borderColor: 'var(--moge-card-border)',
            background:
              'linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.1))',
            color: 'var(--moge-text-main)',
          }}
          className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-base transition-all duration-300 hover:shadow-lg"
        >
          <SiGitlab className="h-5 w-5" fill="currentColor" />
          使用 GitLab 登录
        </button>

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

      {/* 弹窗 - 变量化背景/文字 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          style={{
            backgroundColor: 'var(--moge-card-bg)',
            borderColor: 'var(--moge-card-border)',
            color: 'var(--moge-text-main)',
          }}
          className="border backdrop-blur-xl"
        >
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription style={{ color: 'var(--moge-text-sub)' }}>
              {dialogDesc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
