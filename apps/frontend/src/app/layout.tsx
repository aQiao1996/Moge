import Providers from './providers';
import SettingInjector from './components/SettingInjector';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner'; // 导入 Toaster 组件
import './styles/index.css';

export const metadata: Metadata = {
  title: '墨阁',
  description: '墨阁描述',
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = cookies().get('theme')?.value || 'light';
  return (
    <html lang="zh-CN" suppressHydrationWarning className={theme === 'dark' ? 'dark' : ''}>
      <body>
        <SettingInjector />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-center" duration={2000} />
      </body>
    </html>
  );
}
