'use client';
import { ReactNode } from 'react';
import { AuthSettings } from '../components/AuthSetting';
import { hanFont } from '../font';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${hanFont.variable} bg-moge-gradient relative flex min-h-screen items-stretch overflow-hidden`}
    >
      {/* 浮动粒子背景  */}
      <div className="absolute inset-0">
        {Array.from<undefined>({ length: 28 }).map(() => (
          <span
            className="animate-float absolute block h-3 w-3"
            style={
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
                '--x-1': `${(Math.random() - 0.5) * 60}vw`,
                '--y-1': `${(Math.random() - 0.5) * 60}vh`,
                '--x-2': `${(Math.random() - 0.5) * 60}vw`,
                '--y-2': `${(Math.random() - 0.5) * 60}vh`,
                '--x-3': `${(Math.random() - 0.5) * 60}vw`,
                '--y-3': `${(Math.random() - 0.5) * 60}vh`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 顶部切换栏 */}
      <AuthSettings />

      {/* 左侧品牌区 */}
      <div className="relative hidden items-center justify-center md:flex md:w-1/2">
        <div className="text-moge-text-main text-center">
          <h1 className="font-han brand-title from-moge-primary-400 to-moge-primary-500 drop-shadow-moge-glow-strong bg-gradient-to-r bg-clip-text text-8xl font-extrabold tracking-tight text-transparent">
            墨阁
          </h1>
          <p className="font-han brand-sub text-moge-text-sub drop-shadow-moge-glow-weak mt-4 text-4xl">
            AI 生成 · 小说世界 · 无限灵感
          </p>
        </div>
      </div>

      {/* 右侧玻璃区 */}
      <div className="flex w-full items-center justify-center p-6 md:w-1/2">{children}</div>

      {/* 动画关键帧 */}
      <style jsx global>{`
        @keyframes hyper {
          0% {
            transform: perspective(1000px) translateZ(0) translateX(0) translateY(0) scale(0.4)
              rotateZ(0deg);
            opacity: 0;
            filter: blur(2px);
          }
          10% {
            opacity: 1;
            filter: blur(0);
          }
          25% {
            transform: perspective(1000px) translateZ(120px) translateX(var(--x-1))
              translateY(var(--y-1)) scale(1.8) rotateZ(270deg);
          }
          50% {
            transform: perspective(1000px) translateZ(-80px) translateX(var(--x-2))
              translateY(var(--y-2)) scale(0.6) rotateZ(540deg);
          }
          75% {
            transform: perspective(1000px) translateZ(60px) translateX(var(--x-3))
              translateY(var(--y-3)) scale(1.4) rotateZ(810deg);
          }
          90% {
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: perspective(1000px) translateZ(0) translateX(0) translateY(0) scale(0.4)
              rotateZ(1080deg);
            opacity: 0;
            filter: blur(2px);
          }
        }

        .animate-float {
          animation: hyper 10s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
          will-change: transform, opacity;
          border-radius: 60% 40% 70% 30% / 40% 60% 30% 70%;
          background:
            radial-gradient(circle at 30% 30%, #fff 0.5px, transparent 0.5px), var(--moge-particle);
          box-shadow:
            0 0 4px 1px #fff,
            0 0 12px 4px var(--moge-particle),
            0 0 24px 8px var(--moge-particle),
            0 0 40px 12px var(--moge-particle);
        }

        /* 墨阁主标题 - 呼吸+3D 浮动 */
        @keyframes brand {
          0%,
          100% {
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 8px var(--moge-primary-400)) blur(0);
          }
          50% {
            transform: translateY(-6px) scale(1.03);
            filter: drop-shadow(0 0 16px var(--moge-primary-500)) blur(0.3px);
          }
        }

        /* 副标题 - 扫描线 */
        @keyframes scan {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        .brand-title {
          animation: brand 4s ease-in-out infinite;
          will-change: transform, filter;
        }

        .brand-sub {
          position: relative;
          display: inline-block;
          background-image: linear-gradient(
            90deg,
            transparent 0%,
            var(--moge-scan-mid) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: scan 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
