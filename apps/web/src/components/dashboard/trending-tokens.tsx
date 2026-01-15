'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD, formatPercent } from '@/lib/utils';
import { ApiService, type TrendingToken } from '@/lib/api-services';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useRealtimeMarket } from '@/hooks/use-realtime-data';

function getChainColor(chain: string) {
  switch (chain?.toLowerCase()) {
    case 'base':
      return 'bg-blue-500/10 text-blue-500';
    case 'solana':
      return 'bg-purple-500/10 text-purple-500';
    case 'bsc':
    case 'bnb':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'ethereum':
      return 'bg-blue-600/10 text-blue-600';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

function formatChainName(chain: string) {
  const names: Record<string, string> = {
    base: 'Base',
    solana: 'Solana',
    bsc: 'BNB',
    ethereum: 'ETH',
  };
  return names[chain?.toLowerCase()] || chain;
}

export const TrendingTokens = memo(function TrendingTokens() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 实时市场数据
  const { marketData, isConnected: isRealtimeConnected } = useRealtimeMarket();

  // 获取趋势代币数据
  const fetchTrendingTokens = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const response = await ApiService.getTrendingTokens(10);
      
      if (response.success && response.data) {
        setTokens(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch trending tokens');
      }
    } catch (err) {
      console.error('Error fetching trending tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trending tokens');
      
      // 设置默认数据
      setTokens([
        {
          contract_address: '0x1234567890abcdef1234567890abcdef12345678',
          chain: 'base',
          name: 'Pepe Token',
          symbol: 'PEPE',
          logo_url: '/icons/pepe.png',
          price_usd: '0.00001523',
          price_change_24h: 45.2,
          volume_24h: 12500000,
          market_cap: 64000000,
          url: 'https://example.com',
        },
        {
          contract_address: '0xabcdef1234567890abcdef1234567890abcdef12',
          chain: 'solana',
          name: 'Bonk',
          symbol: 'BONK',
          price_usd: '0.00002345',
          price_change_24h: -12.3,
          volume_24h: 8900000,
          market_cap: 156000000,
        },
        {
          contract_address: '0x5678901234abcdef5678901234abcdef56789012',
          chain: 'ethereum',
          name: 'Shiba Inu',
          symbol: 'SHIB',
          price_usd: '0.00000876',
          price_change_24h: 8.7,
          volume_24h: 15600000,
          market_cap: 5140000000,
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 实时更新价格数据
  useEffect(() => {
    if (marketData.length > 0 && tokens.length > 0) {
      setTokens(prevTokens => 
        prevTokens.map(token => {
          const realtimeData = marketData.find(
            data => data.token === token.contract_address && data.chain === token.chain
          );
          
          if (realtimeData) {
            return {
              ...token,
              price_usd: realtimeData.price.toString(),
              price_change_24h: realtimeData.change24h,
              volume_24h: realtimeData.volume24h,
            };
          }
          
          return token;
        })
      );
    }
  }, [marketData, tokens.length]);

  useEffect(() => {
    fetchTrendingTokens();
  }, [fetchTrendingTokens]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Trending Tokens</CardTitle>
          {isRealtimeConnected && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="/trade">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ListSkeleton count={5} />
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTrendingTokens(false)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </div>
        ) : tokens.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No trending tokens found</div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <a
                key={index}
                href={token.url || `/trade?token=${token.contract_address}`}
                className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {token.logo_url ? (
                      <img
                        src={token.logo_url}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{token.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{token.name}</p>
                        <Badge variant="secondary" className={getChainColor(token.chain)}>
                          {formatChainName(token.chain)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatUSD(parseFloat(token.price_usd))}</p>
                    <p className={`text-sm flex items-center justify-end ${
                      (token.price_change_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {(token.price_change_24h || 0) >= 0 ? (
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-4 w-4" />
                      )}
                      {formatPercent(token.price_change_24h || 0)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
