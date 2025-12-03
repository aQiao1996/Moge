'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthStoreSyncer } from '@/app/components/AuthStoreSyncer';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthStoreSyncer />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
