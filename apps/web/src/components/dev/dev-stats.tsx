'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Rocket, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/lib/utils';

interface DevStatsProps {
  address: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

export function DevStats({ address }: DevStatsProps) {
  const [stats, setStats] = useState({
    totalLaunches: 0,
    successfulLaunches: 0,
    rugCount: 0,
    winRate: 0,
    totalVolume: 0,
    avgAthMultiplier: 0,
    bestLaunch: {
      name: 'N/A',
      multiplier: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/v1/dev/${address}/score`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const devData = data.data;
            setStats({
              totalLaunches: devData.stats?.total_launches || 0,
              successfulLaunches: devData.stats?.successful_launches || 0,
              rugCount: devData.stats?.rug_count || 0,
              winRate: (devData.stats?.win_rate || 0) * 100,
              totalVolume: parseFloat(devData.stats?.total_volume || '0'),
              avgAthMultiplier: devData.stats?.avg_ath_multiplier || 0,
              bestLaunch: {
                name: devData.history?.[0]?.name || 'N/A',
                multiplier: devData.history?.[0]?.ath_market_cap 
                  ? parseFloat(devData.history[0].ath_market_cap) / parseFloat(devData.history[0].market_cap || '1')
                  : 0,
              },
            });
          }
        } else {
          throw new Error('Failed to fetch dev stats');
        }
      } catch (err) {
        console.error('Error fetching dev stats:', err);
        setError('Failed to load dev statistics');
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchDevStats();
    }
  }, [address]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Win Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p
            className={`text-3xl font-bold ${
              stats.winRate >= 70
                ? 'text-success'
                : stats.winRate >= 50
                ? 'text-warning'
                : 'text-destructive'
            }`}
          >
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {stats.successfulLaunches} / {stats.totalLaunches} launches
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Launches
          </CardTitle>
          <Rocket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalLaunches}</p>
          <p className="text-sm text-muted-foreground">
            Avg {stats.avgAthMultiplier.toFixed(1)}x ATH
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Rug Count
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p
            className={`text-3xl font-bold ${
              stats.rugCount === 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {stats.rugCount}
          </p>
          <p className="text-sm text-muted-foreground">
            {stats.rugCount === 0 ? 'Clean record' : 'Rugs detected'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Volume
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatUSD(stats.totalVolume)}</p>
          <p className="text-sm text-muted-foreground">
            Best: {stats.bestLaunch.name} ({stats.bestLaunch.multiplier > 0 ? stats.bestLaunch.multiplier.toFixed(1) : 'N/A'}x)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
