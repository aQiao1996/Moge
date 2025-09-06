import { ReactNode } from 'react';
import { hanFont } from '@/app/font'; // 登录页已经导出，直接引
import AuthSetting from '@/app/components/AuthSetting';
import { Menu, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <div className="flex items-center gap-2">
            <AuthSetting isAbsolute={false} />
            <Button
              title="个人中心"
              style={{
                borderColor: 'var(--moge-btn-border)',
                backgroundColor: 'var(--moge-btn-bg)',
                color: 'var(--moge-btn-text)',
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border p-0 backdrop-blur-sm transition-transform hover:bg-[var(--moge-btn-hover)]"
            >
              <User className="h-4 w-4 text-[var(--moge-text-sub)] hover:text-[var(--moge-text-main)]" />
            </Button>
          </div>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="relative z-10 px-6 py-10">{children}</main>
    </div>
  );
}
