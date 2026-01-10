'use client';

import { TrendingUp, Rocket, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUSD } from '@/lib/utils';

interface DevStatsProps {
  address: string;
}

const mockStats = {
  totalLaunches: 45,
  successfulLaunches: 35,
  rugCount: 0,
  winRate: 77.8,
  totalVolume: 12500000,
  avgAthMultiplier: 8.5,
  bestLaunch: {
    name: 'MOON',
    multiplier: 125,
  },
};

export function DevStats({ address }: DevStatsProps) {
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
              mockStats.winRate >= 70
                ? 'text-success'
                : mockStats.winRate >= 50
                ? 'text-warning'
                : 'text-destructive'
            }`}
          >
            {mockStats.winRate}%
          </p>
          <p className="text-sm text-muted-foreground">
            {mockStats.successfulLaunches} / {mockStats.totalLaunches} launches
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
          <p className="text-3xl font-bold">{mockStats.totalLaunches}</p>
          <p className="text-sm text-muted-foreground">
            Avg {mockStats.avgAthMultiplier}x ATH
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
              mockStats.rugCount === 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {mockStats.rugCount}
          </p>
          <p className="text-sm text-muted-foreground">
            {mockStats.rugCount === 0 ? 'Clean record' : 'Rugs detected'}
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
          <p className="text-3xl font-bold">{formatUSD(mockStats.totalVolume)}</p>
          <p className="text-sm text-muted-foreground">
            Best: {mockStats.bestLaunch.name} ({mockStats.bestLaunch.multiplier}x)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
