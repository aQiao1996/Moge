import Providers from './providers';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './styles/index.css';

export const metadata: Metadata = {
  title: '墨阁',
  description: 'AI 生成 · 小说世界 · 无限灵感',
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-center" duration={2000} />
      </body>
    </html>
  );
}
