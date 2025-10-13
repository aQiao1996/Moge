'use client';

import { User, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

// 动态导入认证设置组件，避免SSR问题
const AuthSetting = dynamic(() => import('@/app/components/AuthSetting'), { ssr: false });

/**
 * 主页面头部组件
 *
 * 功能：
 * - 侧边栏展开/收起切换
 * - 认证设置入口
 * - 用户菜单（个人中心、退出登录）
 * - 扫描线动画效果
 *
 * @param className - 可选的自定义样式类名
 */
export default function MainHeader({ className }: { className?: string }) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <>
      <header
        className={`relative z-20 overflow-hidden border-b border-[var(--moge-card-border)] bg-[var(--moge-header-bg)] ${className}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* 左侧：侧边栏切换按钮 */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={toggleSidebar}
              className="hover:bg-muted/50 h-8 w-8 p-0"
            >
              {open ? (
                <PanelLeftClose className="!h-5 !w-5" />
              ) : (
                <PanelLeft className="!h-5 !w-5" />
              )}
            </Button>
          </div>

          {/* 右侧：认证设置 + 用户菜单 */}
          <div className="flex items-center gap-2">
            <AuthSetting isAbsolute={false} />

            {/* 用户下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  title="个人中心"
                  style={{
                    borderColor: 'var(--moge-btn-border)',
                    backgroundColor: 'var(--moge-btn-bg)',
                    color: 'var(--moge-btn-text)',
                  }}
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border p-0 backdrop-blur-sm transition-transform hover:bg-[var(--moge-btn-hover)]"
                >
                  <User className="h-4 w-4 text-[var(--moge-text-sub)] hover:text-[var(--moge-text-main)]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                style={{
                  backgroundColor: 'var(--moge-header-bg)',
                  borderColor: 'var(--moge-card-border)',
                  color: 'var(--moge-text-main)',
                }}
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex cursor-pointer items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>个人中心</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: 'var(--moge-divider)' }} />
                <DropdownMenuItem
                  onClick={() => void signOut()}
                  className="flex cursor-pointer items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 扫描线动画效果 */}
        <div className="header-scan" />
      </header>

      {/* 扫描线动画样式定义 */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .header-scan {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent, var(--moge-primary-400), transparent);
          animation: scan 3s linear infinite;
        }
      `}</style>
    </>
  );
}
