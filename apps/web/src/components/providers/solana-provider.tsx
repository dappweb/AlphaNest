'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 Solana 组件避免 SSR 问题
const SolanaWalletProvider = dynamic(
  () => import('./solana-wallet-provider').then((mod) => mod.SolanaWalletProvider),
  { 
    ssr: false,
    loading: () => null,
  }
);

interface SolanaProviderProps {
  children: React.ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 在客户端渲染前直接返回 children
  if (!mounted) {
    return <>{children}</>;
  }

  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
