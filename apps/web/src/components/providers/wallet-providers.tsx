'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { type ReactNode } from 'react';
import { wagmiConfig } from '@/config/wagmi';
import { SolanaProvider } from './solana-provider';
import '@rainbow-me/rainbowkit/styles.css';

interface WalletProvidersProps {
  children: ReactNode;
}

export default function WalletProviders({ children }: WalletProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
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
    </WagmiProvider>
  );
}
