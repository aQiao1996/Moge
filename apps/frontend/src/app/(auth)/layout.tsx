/**
 * 认证页面布局组件
 *
 * 为登录和注册页面提供统一的视觉布局，包含：
 * - 浮动粒子背景动画
 * - 左侧品牌展示区（桌面端）
 * - 右侧玻璃化表单容器
 * - 顶部主题切换设置
 */
'use client';
import type { ReactNode } from 'react';
import { hanFont } from '../font';

import dynamic from 'next/dynamic';

// 异步加载浮动粒子组件，禁用 SSR 避免服务端渲染问题
const FloatingDots = dynamic(() => import('./components/FloatingDots').then((mod) => mod.default), {
  ssr: false,
});
// 异步加载认证设置组件（主题切换等），禁用 SSR
const AuthSetting = dynamic(() => import('../components/AuthSetting').then((mod) => mod.default), {
  ssr: false,
});

/**
 * AuthLayout 组件
 * @param children - 认证页面内容（登录或注册表单）
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${hanFont.variable} bg-moge-gradient relative flex min-h-screen items-stretch overflow-hidden`}
    >
      {/* 浮动粒子背景  */}
      <div className="absolute inset-0">
        <FloatingDots />
      </div>

      {/* 顶部切换栏 */}
      <AuthSetting />

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
    </div>
  );
}
