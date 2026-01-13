'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Copy, 
  ExternalLink, 
  LogOut, 
  CheckCircle, 
  Wallet,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatAddress, formatUSD } from '@/lib/utils';

interface WalletOverviewProps {
  className?: string;
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  56: 'BNB Chain',
  11155111: 'Sepolia',
};

const CHAIN_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io/address/',
  8453: 'https://basescan.org/address/',
  56: 'https://bscscan.com/address/',
  11155111: 'https://sepolia.etherscan.io/address/',
};

export function WalletOverview({ className }: WalletOverviewProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { publicKey: solanaPublicKey, disconnect: disconnectSolana } = useWallet();
  
  const [copiedEvm, setCopiedEvm] = useState(false);
  const [copiedSolana, setCopiedSolana] = useState(false);

  const copyAddress = async (addr: string, type: 'evm' | 'solana') => {
    await navigator.clipboard.writeText(addr);
    if (type === 'evm') {
      setCopiedEvm(true);
      setTimeout(() => setCopiedEvm(false), 2000);
    } else {
      setCopiedSolana(true);
      setTimeout(() => setCopiedSolana(false), 2000);
    }
  };

  const explorerUrl = address ? `${CHAIN_EXPLORERS[chainId] || CHAIN_EXPLORERS[1]}${address}` : '';

  const [userStats, setUserStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalVolume: 0,
    pointsBalance: 0,
    insurancePolicies: 0,
    memberSince: '',
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch user stats from API
  useEffect(() => {
    if (!isConnected && !solanaPublicKey) {
      setUserStats({
        totalTrades: 0,
        winRate: 0,
        totalVolume: 0,
        pointsBalance: 0,
        insurancePolicies: 0,
        memberSince: '',
      });
      return;
    }

    const fetchUserStats = async () => {
      setIsLoadingStats(true);
      try {
        const userAddress = address || solanaPublicKey?.toBase58();
        if (!userAddress) return;

        // Fetch user stats from API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev'}/api/v1/user/${userAddress}/stats`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUserStats({
              totalTrades: result.data.totalTrades || 0,
              winRate: result.data.winRate || 0,
              totalVolume: result.data.totalVolume || 0,
              pointsBalance: result.data.pointsBalance || 0,
              insurancePolicies: result.data.insurancePolicies || 0,
              memberSince: result.data.memberSince || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
        // Keep default values on error
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [isConnected, address, solanaPublicKey]);

  if (!isConnected && !solanaPublicKey) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Connect a wallet to view your account details
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Wallet Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EVM Wallet */}
        {isConnected && address && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-white font-bold">
                    {address.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{formatAddress(address)}</span>
                    <Badge variant="outline" className="text-xs">
                      {CHAIN_NAMES[chainId] || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyAddress(address, 'evm')}
                    >
                      {copiedEvm ? (
                        <CheckCircle className="h-3 w-3 mr-1 text-success" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedEvm ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      asChild
                    >
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Explorer
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.00'}
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ {formatUSD(parseFloat(balance?.formatted || '0') * 3500)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-primary/20">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => disconnect()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Solana Wallet */}
        {solanaPublicKey && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-purple-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                    SOL
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">
                      {formatAddress(solanaPublicKey.toBase58())}
                    </span>
                    <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                      Solana
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyAddress(solanaPublicKey.toBase58(), 'solana')}
                    >
                      {copiedSolana ? (
                        <CheckCircle className="h-3 w-3 mr-1 text-success" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedSolana ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      asChild
                    >
                      <a 
                        href={`https://solscan.io/account/${solanaPublicKey.toBase58()}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Solscan
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => disconnectSolana()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Zap className="h-4 w-4" />
              Total Trades
            </div>
            <p className="text-xl font-bold mt-1">{userStats.totalTrades}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              Win Rate
            </div>
            <p className="text-xl font-bold mt-1 text-success">{userStats.winRate}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              Volume
            </div>
            <p className="text-xl font-bold mt-1">{formatUSD(userStats.totalVolume)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              Points
            </div>
            <p className="text-xl font-bold mt-1 text-primary">{userStats.pointsBalance.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="h-4 w-4" />
              Policies
            </div>
            <p className="text-xl font-bold mt-1">{userStats.insurancePolicies}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              Member Since
            </div>
            <p className="text-lg font-medium mt-1">{userStats.memberSince}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
