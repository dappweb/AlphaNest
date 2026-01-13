'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatUSD } from '@/lib/utils';

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface VolumeData {
  date: string;
  volume: number;
  trades: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

const timeRangeConfig: Record<TimeRange, { label: string; days: number }> = {
  '24h': { label: '24H', days: 1 },
  '7d': { label: '7D', days: 7 },
  '30d': { label: '30D', days: 30 },
  '90d': { label: '90D', days: 90 },
};

export function VolumeChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [data, setData] = useState<VolumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolume = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/v1/analytics/volume?range=${timeRange}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const mappedData: VolumeData[] = result.data.map((d: any) => ({
              date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              volume: parseFloat(d.volume || '0'),
              trades: parseInt(d.trades || '0'),
            }));
            setData(mappedData);
          } else {
            setData([]);
          }
        } else {
          throw new Error('Failed to fetch volume');
        }
      } catch (err) {
        console.error('Error fetching volume:', err);
        setError('Failed to load volume data');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVolume();
  }, [timeRange]);

  const totalVolume = data.reduce((acc, d) => acc + d.volume, 0);
  const totalTrades = data.reduce((acc, d) => acc + d.trades, 0);
  const avgVolume = data.length > 0 ? totalVolume / data.length : 0;
  
  // Calculate change
  const change = data.length > 1 && data[0]?.volume > 0
    ? ((data[data.length - 1]?.volume || 0) - (data[0]?.volume || 0)) / data[0].volume * 100
    : 0;
  
  // Find max for scaling
  const maxVolume = data.length > 0 ? Math.max(...data.map(d => d.volume), 1) : 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Trading Volume
          </CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-2xl font-bold">{formatUSD(totalVolume)}</span>
              <span className={`ml-2 text-sm ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                {change >= 0 ? <TrendingUp className="inline h-4 w-4" /> : <TrendingDown className="inline h-4 w-4" />}
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {(Object.keys(timeRangeConfig) as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {timeRangeConfig[range].label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-destructive">
            <p>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No volume data available</p>
          </div>
        ) : (
          <>
            {/* Simple bar chart visualization */}
            <div className="h-64 flex items-end gap-1">
          {data.map((d, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer group relative"
                style={{ height: `${(d.volume / maxVolume) * 100}%`, minHeight: '4px' }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                    <p className="font-medium">{d.date}</p>
                    <p className="text-muted-foreground">Vol: {formatUSD(d.volume)}</p>
                    <p className="text-muted-foreground">Trades: {d.trades.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              {data.length <= 14 && (
                <span className="text-[10px] text-muted-foreground">{d.date.split(' ')[1]}</span>
              )}
            </div>
          ))}
        </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-lg font-semibold">{formatUSD(totalVolume)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-lg font-semibold">{totalTrades.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Volume</p>
                <p className="text-lg font-semibold">{formatUSD(avgVolume)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
