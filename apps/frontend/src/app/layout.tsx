import Providers from './providers';
import SettingInjector from './components/SettingInjector';
import { cookies } from 'next/headers';
import './styles/index.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = cookies().get('theme')?.value || 'light';
  return (
    <html lang="zh-CN" suppressHydrationWarning className={theme === 'dark' ? 'dark' : ''}>
      <body>
        <SettingInjector />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
