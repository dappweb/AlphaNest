'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { SolanaProvider } from './solana-provider';

// Lightweight loading screen
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Loading PopCowDefi...</p>
      </div>
    </div>
  );
}

interface ProvidersProps {
  children: ReactNode;
}

// Create singleton QueryClient - optimized configuration
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return createQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const queryClient = getQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SolanaProvider>
        {children}
      </SolanaProvider>
    </QueryClientProvider>
  );
}
