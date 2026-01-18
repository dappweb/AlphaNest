'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Zap, Circle, ChevronDown, Wallet, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChainType = 'bsc' | 'solana';

interface ChainSwitcherProps {
  onChainChange?: (chain: ChainType) => void;
  defaultChain?: ChainType;
  showWalletButton?: boolean;
  className?: string;
}

const CHAINS = {
  bsc: {
    name: 'BSC',
    fullName: 'BNB Smart Chain',
    icon: '🟡',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    platform: 'Four.meme',
    explorer: 'https://bscscan.com',
  },
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
  defaultChain = 'bsc',
  showWalletButton = true,
  className,
}: ChainSwitcherProps) {
  const [activeChain, setActiveChain] = useState<ChainType>(defaultChain);
  
  // EVM (BSC) wallet
  const { isConnected: evmConnected, address: evmAddress, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Solana wallet
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();

  // 根据连接状态自动切换链
  useEffect(() => {
    // 从 localStorage 读取偏好
    const savedPreference = localStorage.getItem('alphanest-settings');
    if (savedPreference) {
      try {
        const settings = JSON.parse(savedPreference);
        if (settings.preferredChain && settings.preferredChain !== 'auto') {
          setActiveChain(settings.preferredChain as ChainType);
          return;
        }
      } catch {}
    }

    // Auto detect based on connected wallet
    if (evmConnected && !solanaConnected) {
      setActiveChain('bsc');
    } else if (solanaConnected && !evmConnected) {
      setActiveChain('solana');
    }
  }, [evmConnected, solanaConnected]);

  const handleChainSelect = (chain: ChainType) => {
    setActiveChain(chain);
    onChainChange?.(chain);

    // 如果选择 BSC 且 EVM 钱包已连接但在其他网络，切换到 BSC
    if (chain === 'bsc' && evmConnected && chainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
    }
  };

  const currentChain = CHAINS[activeChain];
  const isWalletConnected = activeChain === 'bsc' ? evmConnected : solanaConnected;
  const currentAddress = activeChain === 'bsc' 
    ? evmAddress 
    : solanaPublicKey?.toBase58();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Chain Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <span className="text-base">{currentChain.icon}</span>
            <span className="hidden sm:inline">{currentChain.name}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            Select Network
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* BSC */}
          <DropdownMenuItem 
            onClick={() => handleChainSelect('bsc')}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              activeChain === 'bsc' && 'bg-yellow-500/10'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🟡</span>
              <div>
                <p className="font-medium">BSC</p>
                <p className="text-xs text-muted-foreground">Four.meme</p>
              </div>
            </div>
            {activeChain === 'bsc' && (
              <Badge variant="outline" className="text-[10px] bg-yellow-500/20 text-yellow-500">
                Active
              </Badge>
            )}
            {evmConnected && activeChain !== 'bsc' && (
              <Badge variant="secondary" className="text-[10px]">
                Connected
              </Badge>
            )}
          </DropdownMenuItem>

          {/* Solana */}
          <DropdownMenuItem 
            onClick={() => handleChainSelect('solana')}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              activeChain === 'solana' && 'bg-purple-500/10'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🟣</span>
              <div>
                <p className="font-medium">Solana</p>
                <p className="text-xs text-muted-foreground">pump.fun</p>
              </div>
            </div>
            {activeChain === 'solana' && (
              <Badge variant="outline" className="text-[10px] bg-purple-500/20 text-purple-500">
                Active
              </Badge>
            )}
            {solanaConnected && activeChain !== 'solana' && (
              <Badge variant="secondary" className="text-[10px]">
                Connected
              </Badge>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {/* Explorer Link */}
          <DropdownMenuItem asChild>
            <a 
              href={currentChain.explorer} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              View on {activeChain === 'bsc' ? 'BscScan' : 'Solscan'}
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Connection Status */}
      {isWalletConnected && currentAddress && (
        <Badge 
          variant="outline" 
          className={cn(
            'hidden sm:flex text-[10px] h-6',
            activeChain === 'bsc' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-purple-500/10 text-purple-500 border-purple-500/30'
          )}
        >
          <Circle className="h-1.5 w-1.5 fill-current mr-1" />
          {currentAddress.slice(0, 4)}...{currentAddress.slice(-4)}
        </Badge>
      )}

      {/* Wallet Button */}
      {showWalletButton && (
        <div className="flex">
          {activeChain === 'bsc' ? (
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                if (!mounted || !account || !chain) {
                  return (
                    <Button size="sm" onClick={openConnectModal} className="h-9 bg-yellow-500 hover:bg-yellow-600">
                      <Wallet className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Connect</span>
                    </Button>
                  );
                }
                return (
                  <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
                );
              }}
            </ConnectButton.Custom>
          ) : (
            <WalletMultiButton 
              style={{ 
                height: '36px',
                fontSize: '14px',
                borderRadius: '6px',
                padding: '0 12px',
              }} 
            />
          )}
        </div>
      )}
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
      className={cn(
        'text-[10px]',
        chain === 'bsc' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-purple-500/10 text-purple-500 border-purple-500/30'
      )}
    >
      <span className="mr-1">{chainInfo.icon}</span>
      {chainInfo.name}
    </Badge>
  );
}

/**
 * 获取当前活跃链的 Hook
 */
export function useActiveChain() {
  const [activeChain, setActiveChain] = useState<ChainType>('bsc');
  const { isConnected: evmConnected } = useAccount();
  const { connected: solanaConnected } = useWallet();

  useEffect(() => {
    const savedPreference = localStorage.getItem('alphanest-settings');
    if (savedPreference) {
      try {
        const settings = JSON.parse(savedPreference);
        if (settings.preferredChain && settings.preferredChain !== 'auto') {
          setActiveChain(settings.preferredChain as ChainType);
          return;
        }
      } catch {}
    }

    if (evmConnected && !solanaConnected) {
      setActiveChain('bsc');
    } else if (solanaConnected && !evmConnected) {
      setActiveChain('solana');
    }
  }, [evmConnected, solanaConnected]);

  return {
    activeChain,
    setActiveChain,
    isBsc: activeChain === 'bsc',
    isSolana: activeChain === 'solana',
  };
}

export { CHAINS };
