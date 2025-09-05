'use client';
import { ReactNode } from 'react';
import { AuthSettings } from '../components/AuthSetting';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-stretch overflow-hidden bg-gradient-to-br from-[#0A0A0B] via-[#0D1B2A] to-[#123456]">
      {/* 浮动粒子背景 */}
      <div className="absolute inset-0">
        {Array.from<undefined>({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="animate-float absolute block h-2 w-2 rounded-full bg-[#00F2FE]/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* 顶部切换栏 - 不遮挡内容 */}
      <AuthSettings />

      {/* 左侧品牌区 */}
      <div className="relative hidden items-center justify-center md:flex md:w-1/2">
        <div className="text-center text-white">
          <h1 className="bg-gradient-to-r from-[#00F2FE] to-[#4FACF7] bg-clip-text text-5xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_10px_#00F2FE]">
            墨阁
          </h1>
          <p className="mt-4 text-lg text-white/70 drop-shadow-[0_0_5px_#00F2FE]">
            AI 生成 · 小说世界 · 无限灵感
          </p>
        </div>
      </div>

      {/* 右侧玻璃区 —— 仅放 children */}
      <div className="flex w-full items-center justify-center p-6 md:w-1/2">{children}</div>

      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
