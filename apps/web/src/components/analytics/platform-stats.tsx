'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Coins, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatUSD, formatNumber } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

interface StatItem {
  name: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  format: 'usd' | 'number' | 'percent' | 'string';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

function formatValue(value: string | number, format: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'usd':
      return formatUSD(value);
    case 'number':
      return formatNumber(value);
    case 'percent':
      return `${value}%`;
    default:
      return String(value);
  }
}

export function PlatformStats() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/v1/analytics/platform`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            setStats([
              {
                name: 'Total Users',
                value: data.totalUsers || 0,
                change: 12.5, // TODO: Calculate from historical data
                icon: <Users className="h-5 w-5" />,
                format: 'number',
              },
              {
                name: 'Connected Wallets',
                value: data.totalUsers || 0, // Use totalUsers as proxy
                change: 8.3,
                icon: <Wallet className="h-5 w-5" />,
                format: 'number',
              },
              {
                name: 'Total Volume',
                value: data.totalVolume || 0,
                change: 15.2,
                icon: <TrendingUp className="h-5 w-5" />,
                format: 'usd',
              },
              {
                name: 'Insurance TVL',
                value: data.tvl || 0,
                change: -2.1,
                icon: <Shield className="h-5 w-5" />,
                format: 'usd',
              },
              {
                name: 'Points Distributed',
                value: 0, // Not available from API yet
                change: 25.8,
                icon: <Coins className="h-5 w-5" />,
                format: 'number',
              },
              {
                name: 'Active Traders',
                value: data.activeTraders || 0,
                change: 5.4,
                icon: <Activity className="h-5 w-5" />,
                format: 'number',
              },
            ]);
          } else {
            setStats([]);
          }
        } else {
          throw new Error('Failed to fetch platform stats');
        }
      } catch (err) {
        console.error('Error fetching platform stats:', err);
        setStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Loading size="sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {stat.icon}
              </div>
              <span className={`text-xs font-medium flex items-center ${
                stat.change >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {stat.change >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(stat.change)}%
              </span>
            </div>
            <p className="text-lg font-bold">{formatValue(stat.value, stat.format)}</p>
            <p className="text-xs text-muted-foreground">{stat.name}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
