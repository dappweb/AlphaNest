'use client';

import { useState } from 'react';
import { TokenSearch } from '@/components/trade/token-search';
import { TradePanel } from '@/components/trade/trade-panel';
import { SolanaSwapPanel } from '@/components/trade/solana-swap-panel';
import { TokenInfo } from '@/components/trade/token-info';
import { LazyTokenChart } from '@/components/trade/lazy-token-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

export default function TradePage() {
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected } = useWallet();
  const [selectedChain, setSelectedChain] = useState<'evm' | 'solana'>('solana');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade</h1>
          <p className="text-muted-foreground mt-1">
            Aggregated trading interface for Meme tokens
          </p>
        </div>
        <TokenSearch />
      </div>

      {/* Chain Selector */}
      <Tabs value={selectedChain} onValueChange={(v) => setSelectedChain(v as 'evm' | 'solana')}>
        <TabsList>
          <TabsTrigger value="solana" className="flex items-center gap-2">
            Solana
            <Badge variant="outline" className="text-xs">Jupiter</Badge>
          </TabsTrigger>
          <TabsTrigger value="evm" className="flex items-center gap-2">
            EVM Chains
            <Badge variant="outline" className="text-xs">0x Protocol</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solana" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <LazyTokenChart />
              <TokenInfo />
            </div>
            <div>
              <SolanaSwapPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evm" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <LazyTokenChart />
              <TokenInfo />
            </div>
            <div>
              <TradePanel />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
