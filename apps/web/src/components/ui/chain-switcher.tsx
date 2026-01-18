'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { bsc } from 'wagmi/chains';
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
import { Circle, ChevronDown, Wallet, ExternalLink } from 'lucide-react';
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
  const [prevEvmConnected, setPrevEvmConnected] = useState(false);
  const [prevSolanaConnected, setPrevSolanaConnected] = useState(false);
  
  // EVM (BSC) wallet
  const { isConnected: evmConnected, address: evmAddress, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Solana wallet (safe)
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useSolanaWalletSafe();

  // 保存链偏好到 localStorage
  const saveChainPreference = useCallback((chain: ChainType) => {
    try {
      const saved = localStorage.getItem('popcow-settings');
      const settings = saved ? JSON.parse(saved) : {};
      settings.preferredChain = chain;
      localStorage.setItem('popcow-settings', JSON.stringify(settings));
    } catch {}
  }, []);

  // 初始化时读取偏好
  useEffect(() => {
    const savedPreference = localStorage.getItem('popcow-settings');
    if (savedPreference) {
      try {
        const settings = JSON.parse(savedPreference);
        if (settings.preferredChain && settings.preferredChain !== 'auto') {
          setActiveChain(settings.preferredChain as ChainType);
        }
      } catch {}
    }
  }, []);

  // 🔥 核心逻辑：监听钱包连接状态变化，自动切换链
  useEffect(() => {
    // BSC 钱包刚连接 (之前未连接，现在连接了)
    if (evmConnected && !prevEvmConnected) {
      setActiveChain('bsc');
      saveChainPreference('bsc');
      onChainChange?.('bsc');
    }
    
    // Solana 钱包刚连接 (之前未连接，现在连接了)
    if (solanaConnected && !prevSolanaConnected) {
      setActiveChain('solana');
      saveChainPreference('solana');
      onChainChange?.('solana');
    }

    // 更新上一次状态
    setPrevEvmConnected(evmConnected);
    setPrevSolanaConnected(solanaConnected);
  }, [evmConnected, solanaConnected, prevEvmConnected, prevSolanaConnected, onChainChange, saveChainPreference]);

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
            <SolanaWalletButton />
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
 * 当用户连接钱包时，自动切换到对应的链
 */
export function useActiveChain() {
  const [activeChain, setActiveChain] = useState<ChainType>('bsc');
  const [prevEvmConnected, setPrevEvmConnected] = useState(false);
  const [prevSolanaConnected, setPrevSolanaConnected] = useState(false);
  
  const { isConnected: evmConnected } = useAccount();
  const { connected: solanaConnected } = useSolanaWalletSafe();

  // 保存偏好
  const savePreference = useCallback((chain: ChainType) => {
    try {
      const saved = localStorage.getItem('popcow-settings');
      const settings = saved ? JSON.parse(saved) : {};
      settings.preferredChain = chain;
      localStorage.setItem('popcow-settings', JSON.stringify(settings));
    } catch {}
  }, []);

  // 初始化时读取偏好
  useEffect(() => {
    const savedPreference = localStorage.getItem('popcow-settings');
    if (savedPreference) {
      try {
        const settings = JSON.parse(savedPreference);
        if (settings.preferredChain && settings.preferredChain !== 'auto') {
          setActiveChain(settings.preferredChain as ChainType);
        }
      } catch {}
    }
  }, []);

  // 🔥 监听钱包连接状态变化，自动切换链
  useEffect(() => {
    // BSC 钱包刚连接
    if (evmConnected && !prevEvmConnected) {
      setActiveChain('bsc');
      savePreference('bsc');
    }
    
    // Solana 钱包刚连接
    if (solanaConnected && !prevSolanaConnected) {
      setActiveChain('solana');
      savePreference('solana');
    }

    setPrevEvmConnected(evmConnected);
    setPrevSolanaConnected(solanaConnected);
  }, [evmConnected, solanaConnected, prevEvmConnected, prevSolanaConnected, savePreference]);

  // 手动切换链
  const switchChain = useCallback((chain: ChainType) => {
    setActiveChain(chain);
    savePreference(chain);
  }, [savePreference]);

  return {
    activeChain,
    setActiveChain: switchChain,
    isBsc: activeChain === 'bsc',
    isSolana: activeChain === 'solana',
    evmConnected,
    solanaConnected,
  };
}

export { CHAINS };
