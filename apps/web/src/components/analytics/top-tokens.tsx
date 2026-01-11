'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Flame, Droplets, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD, formatNumber } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';

interface TokenAnalytics {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  holders: number;
  txCount: number;
  isHot: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.suiyiwan1.workers.dev';

function getChainColor(chain: string) {
  switch (chain.toLowerCase()) {
    case 'ethereum':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'base':
      return 'bg-blue-600/10 text-blue-300 border-blue-600/30';
    case 'solana':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
}

export function TopTokens() {
  const [tokens, setTokens] = useState<TokenAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopTokens = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/v1/analytics/tokens?sortBy=volume&limit=20`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const mappedTokens: TokenAnalytics[] = result.data.map((t: any) => ({
              symbol: t.symbol || 'N/A',
              name: t.name || 'Unknown',
              chain: t.chain || 'Unknown',
              price: parseFloat(t.price || '0'),
              change24h: parseFloat(t.price_change_24h || '0'),
              volume24h: parseFloat(t.volume_24h || '0'),
              liquidity: parseFloat(t.liquidity || '0'),
              holders: parseInt(t.holder_count || '0'),
              txCount: 0, // Not available from API
              isHot: parseFloat(t.volume_24h || '0') > 1000000, // Consider hot if volume > 1M
            }));
            setTokens(mappedTokens);
          } else {
            setTokens([]);
          }
        } else {
          throw new Error('Failed to fetch tokens');
        }
      } catch (err) {
        console.error('Error fetching top tokens:', err);
        setError('Failed to load top tokens');
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopTokens();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Top Tokens by Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading text="Loading top tokens..." />
        ) : error ? (
          <EmptyState
            icon={<Flame className="h-12 w-12 text-muted-foreground" />}
            title="Error loading tokens"
            description={error}
          />
        ) : tokens.length === 0 ? (
          <EmptyState
            icon={<Flame className="h-12 w-12 text-muted-foreground" />}
            title="No tokens found"
            description="Top tokens will appear here once trading activity increases"
          />
        ) : (
          <div className="space-y-3">
            {tokens.map((token, index) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className={`w-6 text-center font-bold ${
                  index === 0 ? 'text-yellow-400' : 
                  index === 1 ? 'text-gray-400' : 
                  index === 2 ? 'text-orange-400' : 
                  'text-muted-foreground'
                }`}>
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-sm">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token.symbol}</span>
                    <Badge variant="outline" className={`text-xs ${getChainColor(token.chain)}`}>
                      {token.chain}
                    </Badge>
                    {token.isHot && (
                      <Badge variant="destructive" className="text-xs">
                        <Flame className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium">${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(4)}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm text-muted-foreground">24h</p>
                  <p className={`font-medium flex items-center justify-end gap-1 ${
                    token.change24h >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {token.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-medium">{formatUSD(token.volume24h)}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                    <Droplets className="h-3 w-3" /> Liq
                  </p>
                  <p className="font-medium">{formatUSD(token.liquidity)}</p>
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="text-sm text-muted-foreground">Holders</p>
                  <p className="font-medium">{formatNumber(token.holders)}</p>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
