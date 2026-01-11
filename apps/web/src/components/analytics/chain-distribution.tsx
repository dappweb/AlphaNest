'use client';

import { useState, useEffect } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';

interface ChainData {
  name: string;
  volume: number;
  percentage: number;
  color: string;
  icon: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.suiyiwan1.workers.dev';

const CHAIN_COLORS: Record<string, { color: string; icon: string }> = {
  ethereum: { color: 'bg-blue-500', icon: 'Ξ' },
  base: { color: 'bg-blue-400', icon: 'B' },
  solana: { color: 'bg-purple-500', icon: 'S' },
  bsc: { color: 'bg-yellow-500', icon: 'B' },
  'bnb chain': { color: 'bg-yellow-500', icon: 'B' },
};

export function ChainDistribution() {
  const [chainData, setChainData] = useState<ChainData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChainDistribution = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/v1/analytics/chains`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const totalVolume = (result.data as any[]).reduce(
              (acc, c) => acc + parseFloat(c.total_volume || '0'),
              0
            );

            const mappedData: ChainData[] = (result.data as any[]).map((c) => {
              const volume = parseFloat(c.total_volume || '0');
              const chainInfo = CHAIN_COLORS[c.chain?.toLowerCase() || ''] || {
                color: 'bg-gray-500',
                icon: '•',
              };

              return {
                name: c.chain || 'Unknown',
                volume,
                percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
                color: chainInfo.color,
                icon: chainInfo.icon,
              };
            });

            setChainData(mappedData);
          } else {
            setChainData([]);
          }
        } else {
          throw new Error('Failed to fetch chain distribution');
        }
      } catch (err) {
        console.error('Error fetching chain distribution:', err);
        setError('Failed to load chain distribution');
        setChainData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChainDistribution();
  }, []);

  const totalVolume = chainData.reduce((acc, c) => acc + c.volume, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Volume by Chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading text="Loading chain distribution..." />
        ) : error ? (
          <EmptyState
            icon={<Globe className="h-12 w-12 text-muted-foreground" />}
            title="Error loading data"
            description={error}
          />
        ) : chainData.length === 0 ? (
          <EmptyState
            icon={<Globe className="h-12 w-12 text-muted-foreground" />}
            title="No chain data available"
            description="Chain distribution will appear here once trading activity increases"
          />
        ) : (
          <>
            {/* Visual distribution bar */}
            <div className="h-4 rounded-full overflow-hidden flex mb-6">
              {chainData.map((chain, i) => (
            <div
              key={chain.name}
              className={`${chain.color} transition-all hover:opacity-80`}
              style={{ width: `${chain.percentage}%` }}
              title={`${chain.name}: ${chain.percentage}%`}
            />
          ))}
        </div>

        {/* Chain list */}
        <div className="space-y-3">
          {chainData.map((chain) => (
            <div
              key={chain.name}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${chain.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {chain.icon}
                </div>
                <div>
                  <p className="font-medium">{chain.name}</p>
                  <p className="text-sm text-muted-foreground">{chain.percentage}% of total</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatUSD(chain.volume)}</p>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${chain.color}`}
                    style={{ width: `${chain.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-muted-foreground">Total Volume (24h)</span>
              <span className="text-xl font-bold">{formatUSD(totalVolume)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
