// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthStoreSyncer } from '@/app/components/AuthStoreSyncer';
import { setClientHandlers } from '@/lib/request';
import { toast } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  setClientHandlers({
    notify: (msg, level) => (level === 'error' ? toast.error(msg) : toast(msg)),
    getToken: () => localStorage.getItem('auth-token') || undefined,
  });
  return (
    <SessionProvider>
      <AuthStoreSyncer />
      {children}
    </SessionProvider>
  );
}
