import Providers from './providers';
import SettingInjector from './components/SettingInjector';
import './styles/index.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SettingInjector />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
