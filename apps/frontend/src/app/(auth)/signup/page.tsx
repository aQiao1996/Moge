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

      <form onSubmit={void handleSubmit} className="mt-5 space-y-4">
        <div>
          <label style={{ color: 'var(--moge-text-sub)' }} className="block text-sm">
            账号
          </label>
          <input
            id="account"
            type="text"
            placeholder="请输入账号"
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

        <div>
          <label style={{ color: 'var(--moge-text-sub)' }} className="block text-sm">
            确认密码
          </label>
          <input
            id="confirm"
            type="password"
            placeholder="再次输入密码"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-moge mt-1 w-full rounded-md border px-3 py-2 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00F2FE]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background:
              'linear-gradient(to right, var(--moge-primary-400), var(--moge-primary-500))',
            boxShadow: 'var(--moge-glow-btn)',
          }}
          className="h-10 w-full cursor-pointer rounded-md py-2 text-base font-bold text-white/90 shadow-lg disabled:opacity-60"
        >
          {loading ? '注册中...' : '立即注册'}
        </button>
      </form>

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
