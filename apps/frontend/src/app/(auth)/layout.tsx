'use client';
import { ReactNode } from 'react';
import { AuthSettings } from '../components/AuthSetting';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-moge-gradient relative flex min-h-screen items-stretch overflow-hidden">
      {/* 浮动粒子背景  */}
      <div className="absolute inset-0">
        {Array.from<undefined>({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="animate-float bg-moge-particle absolute block h-2 w-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* 顶部切换栏 */}
      <AuthSettings />

      {/* 左侧品牌区 */}
      <div className="relative hidden items-center justify-center md:flex md:w-1/2">
        <div className="text-moge-text-main text-center">
          <h1 className="from-moge-primary-400 to-moge-primary-500 drop-shadow-moge-glow-strong bg-gradient-to-r bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
            墨阁
          </h1>
          <p className="text-moge-text-sub drop-shadow-moge-glow-weak mt-4 text-lg">
            AI 生成 · 小说世界 · 无限灵感
          </p>
        </div>
      </div>

      {/* 右侧玻璃区 */}
      <div className="flex w-full items-center justify-center p-6 md:w-1/2">{children}</div>

      {/* 动画关键帧 */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-25px) translateX(5px) scale(1.3) rotate(90deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-10px) translateX(-5px) scale(0.9) rotate(180deg);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-30px) translateX(3px) scale(1.2) rotate(270deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1) rotate(360deg);
            opacity: 0.4;
          }
        }

        .animate-float {
          animation: float 7s ease-in-out infinite;
          will-change: transform, opacity;
          filter: blur(0.5px); /* 冷光柔边 */
          box-shadow: 0 0 8px 2px var(--moge-particle); /* 自带冰蓝光晕 */
        }
      `}</style>
    </div>
  );
}
