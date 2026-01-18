'use client';

import { type ReactNode } from 'react';
import { SolanaProvider } from './solana-provider';

interface WalletProvidersProps {
  children: ReactNode;
}

/**
 * 钱包提供者 - 仅支持 Solana
 * 本项目仅支持 Solana 链上的 pump.fun 代币
 */
export default function WalletProviders({ children }: WalletProvidersProps) {
  return (
    <SolanaProvider>
      {children}
    </SolanaProvider>
  );
}
