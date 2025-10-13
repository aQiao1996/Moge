/**
 * 浮动粒子背景组件
 *
 * 为认证页面提供动态的 3D 粒子动画背景效果
 * 特性：
 * - 生成 20 个随机位置的浮动粒子
 * - 3D 透视动画（translateZ）
 * - 随机延迟和持续时间，形成错落有致的动画效果
 * - 包含品牌标题的呼吸动画和副标题的扫描线效果
 */
'use client';

/**
 * FloatingDots 组件
 * @returns 浮动粒子背景元素和动画样式
 */
export default function FloatingDots() {
  return (
    <>
      {/* 生成 20 个浮动粒子 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="animate-float absolute block h-3 w-3"
          style={
            {
              // 随机初始位置
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              // 随机动画延迟（0-5秒）
              animationDelay: `${Math.random() * 5}s`,
              // 随机动画持续时间（8-12秒）
              animationDuration: `${8 + Math.random() * 4}s`,
              // 定义 3 个关键帧的随机位移量（CSS 变量）
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
      {/* 动画关键帧和样式定义 */}
      <style jsx global>{`
        /* 粒子 3D 超空间动画 */
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

        /* 浮动粒子样式 */
        .animate-float {
          animation: hyper 10s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
          will-change: transform, opacity;
          /* 不规则圆形 */
          border-radius: 60% 40% 70% 30% / 40% 60% 30% 70%;
          /* 渐变背景和多层光晕 */
          background:
            radial-gradient(circle at 30% 30%, #fff 0.5px, transparent 0.5px), var(--moge-particle);
          box-shadow:
            0 0 4px 1px #fff,
            0 0 12px 4px var(--moge-particle),
            0 0 24px 8px var(--moge-particle),
            0 0 40px 12px var(--moge-particle);
        }

        /* 墨阁主标题 - 呼吸 + 3D 浮动动画 */
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

        /* 副标题 - 扫描线效果 */
        @keyframes scan {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        /* 应用品牌标题动画 */
        .brand-title {
          animation: brand 4s ease-in-out infinite;
          will-change: transform, filter;
        }

        /* 应用副标题扫描线动画 */
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
    </>
  );
}
