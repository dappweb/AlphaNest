'use client';

import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD, formatPercent, formatNumber } from '@/lib/utils';

const trendingTokens = [
  {
    id: 1,
    name: 'PEPE',
    symbol: 'PEPE',
    chain: 'Base',
    price: 0.00001234,
    change24h: 45.2,
    volume24h: 12500000,
    marketCap: 5200000000,
    devScore: 92,
  },
  {
    id: 2,
    name: 'WOJAK',
    symbol: 'WOJAK',
    chain: 'Solana',
    price: 0.0234,
    change24h: -12.5,
    volume24h: 8900000,
    marketCap: 890000000,
    devScore: 78,
  },
  {
    id: 3,
    name: 'BONK',
    symbol: 'BONK',
    chain: 'Solana',
    price: 0.00002345,
    change24h: 23.1,
    volume24h: 15600000,
    marketCap: 1200000000,
    devScore: 85,
  },
  {
    id: 4,
    name: 'DOGE2.0',
    symbol: 'DOGE2',
    chain: 'BNB',
    price: 0.000456,
    change24h: 8.7,
    volume24h: 3400000,
    marketCap: 340000000,
    devScore: 65,
  },
  {
    id: 5,
    name: 'SHIB2',
    symbol: 'SHIB2',
    chain: 'Base',
    price: 0.0000089,
    change24h: -5.3,
    volume24h: 2100000,
    marketCap: 210000000,
    devScore: 71,
  },
];

function getChainColor(chain: string) {
  switch (chain) {
    case 'Base':
      return 'bg-blue-500/10 text-blue-500';
    case 'Solana':
      return 'bg-purple-500/10 text-purple-500';
    case 'BNB':
      return 'bg-yellow-500/10 text-yellow-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

function getDevScoreColor(score: number) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'destructive';
}

export function TrendingTokens() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trending Tokens</CardTitle>
        <Button variant="ghost" size="sm">
          View All
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trendingTokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
                  {token.symbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${token.symbol}
                    </span>
                    <Badge
                      variant="outline"
                      className={getChainColor(token.chain)}
                    >
                      {token.chain}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Vol: {formatUSD(token.volume24h)}</span>
                    <span>|</span>
                    <span>MCap: {formatUSD(token.marketCap)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Badge variant={getDevScoreColor(token.devScore)}>
                  Dev: {token.devScore}
                </Badge>
                <div className="text-right">
                  <p className="font-medium">${token.price.toFixed(8)}</p>
                  <p
                    className={`flex items-center text-sm ${
                      token.change24h >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {token.change24h >= 0 ? (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    )}
                    {formatPercent(token.change24h)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
