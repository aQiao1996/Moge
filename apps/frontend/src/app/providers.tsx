// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthStoreSyncer } from '@/app/components/AuthStoreSyncer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthStoreSyncer />
      {children}
    </SessionProvider>
  );
}
