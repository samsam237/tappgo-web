'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            cacheTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401) {
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  // Synchronisation basique des actions offline quand la connexion revient
  useEffect(() => {
    const sync = () => {
      apiClient.syncOfflineQueue().catch(() => undefined);
    };
    // tenter au démarrage
    sync();
    // et au retour online
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        {typeof window !== 'undefined' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
