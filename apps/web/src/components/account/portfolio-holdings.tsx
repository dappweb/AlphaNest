'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, ExternalLink, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatUSD } from '@/lib/utils';
import { useTokenBalances, type TokenBalance } from '@/hooks/use-token-balances';

function getChainColor(chain: string) {
  switch (chain.toLowerCase()) {
    case 'ethereum':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'base':
      return 'bg-blue-600/10 text-blue-300 border-blue-600/30';
    case 'solana':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'bnb chain':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
}

export function PortfolioHoldings() {
  const { isConnected } = useAccount();
  const { balances, isLoading, error } = useTokenBalances();
  const [sortBy, setSortBy] = useState<'value' | 'change'>('value');

  const totalValue = balances.reduce((acc, h) => acc + (h.value || 0), 0);
  const totalChange = balances.reduce((acc, h) => acc + ((h.value || 0) * (h.change24h || 0)) / 100, 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

  const sortedHoldings = [...balances].sort((a, b) => {
    if (sortBy === 'value') return (b.value || 0) - (a.value || 0);
    return (b.change24h || 0) - (a.change24h || 0);
  });

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Connect your wallet to view portfolio holdings</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading token balances...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Portfolio Holdings</CardTitle>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold">{formatUSD(totalValue)}</span>
            <span className={`flex items-center text-sm ${
              totalChangePercent >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {totalChangePercent >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}% (24h)
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'value' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('value')}
          >
            By Value
          </Button>
          <Button
            variant={sortBy === 'change' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('change')}
          >
            By Change
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedHoldings.length > 0 ? (
            sortedHoldings.map((holding) => {
              const balanceNum = parseFloat(holding.balance);
              return (
                <div
                  key={`${holding.chainId}-${holding.address}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-sm">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{holding.symbol}</span>
                        <Badge variant="outline" className={`text-xs ${getChainColor(holding.chain)}`}>
                          {holding.chain}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{holding.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-medium">
                        {balanceNum > 1000000 
                          ? `${(balanceNum / 1000000).toFixed(2)}M`
                          : balanceNum > 1000
                          ? `${(balanceNum / 1000).toFixed(2)}K`
                          : balanceNum.toFixed(4)
                        }
                      </p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-semibold">{formatUSD(holding.value || 0)}</p>
                      {holding.change24h !== undefined && (
                        <p className={`text-sm flex items-center justify-end gap-1 ${
                          holding.change24h >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {holding.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tokens found in your wallet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
