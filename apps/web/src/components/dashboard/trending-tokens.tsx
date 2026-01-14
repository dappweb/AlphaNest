'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD, formatPercent } from '@/lib/utils';

interface TrendingToken {
  contract_address: string;
  chain: string;
  name: string;
  symbol: string;
  logo_url?: string;
  price_usd: string;
  price_change_24h: number;
  volume_24h: string | number;
  market_cap: string | number;
  url?: string;
}

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
      return 'bg-slate-500/10 text-slate-400';
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

export function TrendingTokens() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrendingTokens() {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';
        const res = await fetch(`${apiUrl}/api/v1/tokens/trending?limit=10`);
        
        if (!res.ok) throw new Error('Failed to fetch tokens');
        
        const data = await res.json();
        if (data.success && data.data) {
          setTokens(data.data);
        }
      } catch (err) {
        console.error('Error fetching trending tokens:', err);
        setError('Failed to load trending tokens');
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingTokens();
    // 每 2 分钟刷新一次
    const interval = setInterval(fetchTrendingTokens, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trending Tokens</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/trade">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-muted-foreground">{error}</div>
        ) : tokens.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No trending tokens found</div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <a
                key={token.contract_address || index}
                href={token.url || `/trade?token=${token.contract_address}`}
                target={token.url ? '_blank' : undefined}
                rel={token.url ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-4">
                  {token.logo_url ? (
                    <img
                      src={token.logo_url}
                      alt={token.symbol}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.symbol || '???'}</span>
                      <Badge
                        variant="outline"
                        className={getChainColor(token.chain)}
                      >
                        {formatChainName(token.chain)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Vol: {formatUSD(Number(token.volume_24h) || 0)}</span>
                      <span>|</span>
                      <span>MCap: {formatUSD(Number(token.market_cap) || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${Number(token.price_usd || 0).toFixed(8)}
                  </p>
                  <p
                    className={`flex items-center justify-end text-sm ${
                      (token.price_change_24h || 0) >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {(token.price_change_24h || 0) >= 0 ? (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    )}
                    {formatPercent(token.price_change_24h || 0)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
