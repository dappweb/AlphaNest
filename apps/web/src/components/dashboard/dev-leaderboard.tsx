'use client';

import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatAddress, formatPercent } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ApiService, type DeveloperRanking } from '@/lib/api-services';
import { ListSkeleton } from '@/components/ui/skeleton';

export function DevLeaderboard() {
  const [developers, setDevelopers] = useState<DeveloperRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取开发者排名数据
  const fetchDeveloperRankings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ApiService.getDeveloperRankings(10);
      
      if (response.success && response.data) {
        setDevelopers(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch developer rankings');
      }
    } catch (err) {
      console.error('Error fetching developer rankings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load developer rankings');
      
      // 设置默认数据
      setDevelopers([
        {
          id: 1,
          address: '0x1234567890abcdef1234567890abcdef12345678',
          alias: 'AlphaWhale',
          winRate: 78.5,
          totalLaunches: 45,
          rugCount: 0,
          verified: true,
          rank: 1,
          avgReturn: 245.6,
          totalVolume: 12500000,
          reputation: 95,
        },
        {
          id: 2,
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          alias: 'MemeKing',
          winRate: 72.3,
          totalLaunches: 62,
          rugCount: 1,
          verified: true,
          rank: 2,
          avgReturn: 189.3,
          totalVolume: 8900000,
          reputation: 87,
        },
        {
          id: 3,
          address: '0x5678901234abcdef5678901234abcdef56789012',
          alias: 'CryptoWizard',
          winRate: 68.9,
          totalLaunches: 38,
          rugCount: 0,
          verified: true,
          rank: 3,
          avgReturn: 156.7,
          totalVolume: 6700000,
          reputation: 92,
        },
        {
          id: 4,
          address: '0x90abcdef1234567890abcdef1234567890abcdef',
          alias: 'TokenMaster',
          winRate: 65.2,
          totalLaunches: 51,
          rugCount: 2,
          verified: false,
          rank: 4,
          avgReturn: 134.2,
          totalVolume: 5400000,
          reputation: 73,
        },
        {
          id: 5,
          address: '0x34567890abcdef1234567890abcdef1234567890',
          alias: 'DeFiDev',
          winRate: 61.7,
          totalLaunches: 29,
          rugCount: 0,
          verified: true,
          rank: 5,
          avgReturn: 98.5,
          totalVolume: 3200000,
          reputation: 85,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeveloperRankings();
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-white border-yellow-500';
      case 2:
        return 'bg-gray-400 text-white border-gray-400';
      case 3:
        return 'bg-orange-600 text-white border-orange-600';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Devs</CardTitle>
          <Button variant="ghost" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ListSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Devs</CardTitle>
          <Button variant="ghost" size="sm">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Devs</CardTitle>
        <Button variant="ghost" size="sm">
          View All
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${getRankBadge(
                    dev.rank
                  )}`}
                >
                  #{dev.rank}
                </div>
                <Avatar>
                  <AvatarFallback>
                    {(dev.alias || dev.address).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {dev.alias || formatAddress(dev.address)}
                    </span>
                    {dev.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(dev.address)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p
                    className={`font-medium ${
                      dev.winRate >= 70
                        ? 'text-success'
                        : dev.winRate >= 50
                        ? 'text-warning'
                        : 'text-destructive'
                    }`}
                  >
                    {dev.winRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Launches</p>
                  <p className="font-medium">{dev.totalLaunches}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Rugs</p>
                  <p
                    className={`flex items-center font-medium ${
                      dev.rugCount > 0 ? 'text-destructive' : 'text-success'
                    }`}
                  >
                    {dev.rugCount > 0 && (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    {dev.rugCount}
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
