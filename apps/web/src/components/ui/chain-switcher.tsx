'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Wallet, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Safe Solana wallet hook
function useSolanaWalletSafe() {
  try {
    const { useWallet } = require('@solana/wallet-adapter-react');
    return useWallet();
  } catch {
    return { publicKey: null, connected: false };
  }
}

// Dynamic import for WalletMultiButton
function SolanaWalletButton() {
  try {
    const { WalletMultiButton } = require('@solana/wallet-adapter-react-ui');
    return (
      <WalletMultiButton 
        style={{ 
          height: '36px',
          fontSize: '14px',
          borderRadius: '6px',
          padding: '0 12px',
        }} 
      />
    );
  } catch {
    return (
      <Button size="sm" disabled className="h-9 bg-purple-500">
        <Wallet className="h-4 w-4 mr-1.5" />
        Solana
      </Button>
    );
  }
}

export type ChainType = 'solana'; // 仅支持 Solana

interface ChainSwitcherProps {
  onChainChange?: (chain: ChainType) => void;
  defaultChain?: ChainType;
  showWalletButton?: boolean;
  className?: string;
}

const CHAINS = {
  solana: {
    name: 'Solana',
    fullName: 'Solana',
    icon: '🟣',
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
    platform: 'pump.fun',
    explorer: 'https://solscan.io',
  },
};

export function ChainSwitcher({
  onChainChange,
  defaultChain = 'solana',
  showWalletButton = true,
  className,
}: ChainSwitcherProps) {
  const [activeChain] = useState<ChainType>(defaultChain);
  
  // Solana wallet (safe)
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useSolanaWalletSafe();

  const currentChain = CHAINS[activeChain];
  const currentAddress = solanaPublicKey?.toBase58();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Chain Indicator */}
      <Badge 
        variant="outline" 
        className="h-9 gap-2 bg-purple-500/10 text-purple-500 border-purple-500/30"
      >
        <span className="text-base">{currentChain.icon}</span>
        <span className="hidden sm:inline">{currentChain.name}</span>
      </Badge>

      {/* Connection Status */}
      {solanaConnected && currentAddress && (
        <Badge 
          variant="outline" 
          className="hidden sm:flex text-[10px] h-6 bg-purple-500/10 text-purple-500 border-purple-500/30"
        >
          <Circle className="h-1.5 w-1.5 fill-current mr-1" />
          {currentAddress.slice(0, 4)}...{currentAddress.slice(-4)}
        </Badge>
      )}

      {/* Wallet Button */}
      {showWalletButton && <SolanaWalletButton />}
    </div>
  );
}

/**
 * 简化版链指示器 (不含钱包按钮)
 */
export function ChainIndicator({ chain }: { chain: ChainType }) {
  const chainInfo = CHAINS[chain];
  
  return (
    <Badge 
      variant="outline" 
      className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/30"
    >
      <span className="mr-1">{chainInfo.icon}</span>
      {chainInfo.name}
    </Badge>
  );
}

/**
 * 获取当前活跃链的 Hook
 * 项目仅支持 Solana
 */
export function useActiveChain() {
  const [activeChain] = useState<ChainType>('solana');
  const { connected: solanaConnected } = useSolanaWalletSafe();

  // 手动切换链（仅用于兼容性，实际只有 Solana）
  const switchChain = useCallback((chain: ChainType) => {
    // 仅支持 Solana，忽略其他链
    if (chain !== 'solana') return;
  }, []);

  return {
    activeChain,
    setActiveChain: switchChain,
    isBsc: false, // 不再支持 BSC
    isSolana: true, // 仅支持 Solana
    evmConnected: false, // 不再支持 EVM
    solanaConnected,
  };
}

export { CHAINS };
