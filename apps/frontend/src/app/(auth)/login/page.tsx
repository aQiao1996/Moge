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
  const [account, setAccount] = useState(''); // 用户名/邮箱都可
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /** 弹窗状态 */
  const [open, setOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDesc, setDialogDesc] = useState('');

  const handleCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) return;
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false, // 我们自己控制跳转/弹窗
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
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-6 shadow-2xl shadow-[#00F2FE]/20 backdrop-blur-xl">
        <h2 className="text-center text-2xl font-bold text-white">欢迎回来</h2>
        <p className="mt-1 text-center text-sm text-white/70">登录后可体验 AI 小说生成</p>

        {/* 账号密码登录 */}
        <form onSubmit={void handleCredential} className="mt-5 space-y-4">
          <div>
            <label htmlFor="account" className="block text-sm text-white/90">
              账号
            </label>
            <input
              id="account"
              type="text"
              placeholder="用户名 / 邮箱"
              required
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/90">
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full cursor-pointer bg-gradient-to-r from-[#00F2FE] to-[#4FACF7] text-base text-white/90 shadow-lg shadow-[#00F2FE]/40 hover:shadow-[0_0_20px] hover:shadow-[#00F2FE]/60 disabled:opacity-60"
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        {/* 分割线 */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/20 px-2 text-white/60">Or</span>
          </div>
        </div>

        {/* GitLab 登录 */}
        <button
          onClick={() => void signIn('gitlab', { callbackUrl: '/' })}
          className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/20 bg-gradient-to-br from-white/5 to-white/10 px-4 py-2 text-base text-white/90 transition-all duration-300 hover:shadow-[0_0_20px] hover:shadow-[#00F2FE]/60"
        >
          <SiGitlab className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" />
          使用 GitLab 登录
        </button>

        <p className="mt-4 text-center text-sm text-white/60">
          还没有账户？
          <Link href="/signup" className="ml-1 text-[#00F2FE] hover:text-[#0099a3]">
            立即注册
          </Link>
        </p>
      </div>

      {/* 登录结果弹窗 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-black/30 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription className="text-white/70">{dialogDesc}</DialogDescription>
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
