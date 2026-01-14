'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { useState, useEffect, type ReactNode } from 'react';
import { wagmiConfig } from '@/config/wagmi';
import { SolanaProvider } from './solana-provider';
import '@rainbow-me/rainbowkit/styles.css';

// 轻量级加载屏幕
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Loading PopCow...</p>
      </div>
    </div>
  );
}

interface ProvidersProps {
  children: ReactNode;
}

// 创建单例 QueryClient - 优化配置
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5分钟缓存
        gcTime: 10 * 60 * 1000, // 10分钟垃圾回收
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: 'hsl(142, 76%, 36%)',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
          modalSize="compact"
        >
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
