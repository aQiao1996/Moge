import Providers from './providers';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import StoreInitializer from './components/StoreInitializer';
import './styles/index.css';

export const metadata: Metadata = {
  title: '墨阁',
  description: 'AI 生成 · 小说世界 · 无限灵感',
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeCookie = cookies().get('theme')?.value;
  const theme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : 'light';

  return (
    <html lang="zh-CN" suppressHydrationWarning className={theme === 'dark' ? 'dark' : ''}>
      <body>
        <Providers>
          <StoreInitializer theme={theme} />
          {children}
        </Providers>
        <Toaster richColors position="top-center" duration={2000} />
      </body>
    </html>
  );
}
