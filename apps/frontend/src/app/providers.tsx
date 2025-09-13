// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { api, trpcClient } from '@/lib/trpc';
import { AuthStoreSyncer } from '@/app/components/AuthStoreSyncer';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000, // 5s
          },
        },
      })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AuthStoreSyncer />
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}
