'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { OrganizationProvider } from '@/contexts/organization-context';
import { SubscriptionProvider } from '@/contexts/subscription-context';
import { FileProvider } from '@/contexts/file-context';
import { IntegrationProvider } from '@/contexts/integration-context';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <FileProvider>
          <IntegrationProvider>
            <OrganizationProvider>{children}</OrganizationProvider>
          </IntegrationProvider>
        </FileProvider>
      </SubscriptionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
