'use client';

import { Menu, User, LogOut } from 'lucide-react';
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

const AuthSetting = dynamic(() => import('@/app/components/AuthSetting'), { ssr: false });

export default function MainHeader({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <header
        className={`relative z-20 overflow-hidden border-b border-[var(--moge-card-border)] bg-[var(--moge-header-bg)] ${className}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Menu
              className="h-5 w-5 cursor-pointer text-[var(--moge-text-sub)] hover:text-[var(--moge-text-main)]"
              onClick={toggleSidebar}
            />
          </div>
          <div className="flex items-center gap-2">
            <AuthSetting isAbsolute={false} />
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

        {/* 扫描线 */}
        <div className="header-scan" />
      </header>

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
