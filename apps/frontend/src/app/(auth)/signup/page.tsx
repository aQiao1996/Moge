'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignupPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password || password !== confirm) return;
    setLoading(true);

    // 1. 调你的注册接口（示例用 /api/signup）
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password }),
    });

    if (res.ok) {
      await signIn('email', { account, callbackUrl: '/' });
    } else {
      // alert((await res.json()).message || '注册失败');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-6 shadow-2xl shadow-[#00F2FE]/20 backdrop-blur-xl">
      <h2 className="text-center text-2xl font-bold text-white">创建账户</h2>
      <p className="mt-1 text-center text-sm text-white/70">注册后即可体验 AI 小说生成</p>

      <form onSubmit={void handleSubmit} className="mt-5 space-y-4">
        {/* 账号 */}
        <div>
          <label htmlFor="account" className="block text-sm text-white/90">
            账号
          </label>
          <input
            id="account"
            type="text"
            placeholder="请输入账号"
            required
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
          />
        </div>

        {/* 密码 */}
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

        {/* 确认密码 */}
        <div>
          <label htmlFor="confirm" className="block text-sm text-white/90">
            确认密码
          </label>
          <input
            id="confirm"
            type="password"
            placeholder="再次输入密码"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full cursor-pointer rounded-md bg-gradient-to-r from-[#00F2FE] to-[#4FACF7] py-2 text-base font-bold text-white/90 shadow-lg shadow-[#00F2FE]/40 transition-all duration-300 hover:shadow-[0_0_20px] hover:shadow-[#00F2FE]/60 disabled:opacity-60"
        >
          {loading ? '注册中...' : '立即注册'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-white/60">
        已有账户？
        <Link href="/login" className="ml-1 text-[#00F2FE] hover:text-[#0099a3]">
          立即登录
        </Link>
      </p>
    </div>
  );
}
