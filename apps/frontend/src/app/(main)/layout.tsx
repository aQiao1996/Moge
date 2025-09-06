import { ReactNode } from 'react';
import { hanFont } from '@/app/font'; // 登录页已经导出，直接引
import MainHeader from './components/MainHeader';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${hanFont.variable} bg-moge-gradient relative min-h-screen overflow-hidden`}>
      {/* 顶部工具栏 */}
      <MainHeader />

      {/* 页面内容 */}
      <main className="relative z-10 px-6 py-10">{children}</main>
    </div>
  );
}
