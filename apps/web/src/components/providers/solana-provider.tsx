'use client';

import { SolanaWalletProvider } from './solana-wallet-provider';

interface SolanaProviderProps {
  children: React.ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  // 直接导入并使用 SolanaWalletProvider
  // 不再使用 dynamic import，因为 WalletProvider 需要在组件树中始终可用
  // 这样可以确保 WalletContext 总是可用
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
