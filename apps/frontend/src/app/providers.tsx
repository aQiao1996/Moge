// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthStoreSyncer } from '@/app/components/AuthStoreSyncer';
import SettingInjector from './components/SettingInjector';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingInjector />
      <AuthStoreSyncer />
      {children}
    </SessionProvider>
  );
}
