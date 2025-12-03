import Providers from './providers';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './styles/index.css';

export const metadata: Metadata = {
  title: '墨阁',
  description: 'AI 生成 · 小说世界 · 无限灵感',
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster richColors position="top-center" duration={2000} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
