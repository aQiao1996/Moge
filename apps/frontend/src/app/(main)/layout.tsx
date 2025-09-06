import { ReactNode } from 'react';
import { hanFont } from '@/app/font'; // 登录页已经导出，直接引
import AuthSetting from '@/app/components/AuthSetting';
import { Menu, Sparkles, User } from 'lucide-react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${hanFont.variable} bg-moge-gradient relative min-h-screen overflow-hidden`}>
      {/* 顶部工具栏 */}
      <header className="glass relative z-20 border-b-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Menu className="h-5 w-5 cursor-pointer text-[var(--moge-text-sub)] hover:text-[var(--moge-text-main)]" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--moge-primary-400)]" />
              <span className="font-han text-base font-bold">墨阁</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AuthSetting />
            <User className="h-5 w-5 cursor-pointer text-[var(--moge-text-sub)] hover:text-[var(--moge-text-main)]" />
          </div>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="relative z-10 px-6 py-10">{children}</main>
    </div>
  );
}
