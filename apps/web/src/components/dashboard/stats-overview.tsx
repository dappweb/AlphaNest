'use client';

import { TrendingUp, Users, Shield, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatUSD, formatNumber } from '@/lib/utils';

const stats = [
  {
    name: 'Total Volume (24h)',
    value: 2450000,
    change: 12.5,
    icon: TrendingUp,
    format: 'usd',
  },
  {
    name: 'Active Devs',
    value: 1234,
    change: 8.2,
    icon: Users,
    format: 'number',
  },
  {
    name: 'Insurance TVL',
    value: 890000,
    change: -2.1,
    icon: Shield,
    format: 'usd',
  },
  {
    name: 'Total Points Distributed',
    value: 45600000,
    change: 15.3,
    icon: Coins,
    format: 'number',
  },
];

export function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.change >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {stat.change >= 0 ? '+' : ''}
                {stat.change}%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stat.format === 'usd'
                  ? formatUSD(stat.value)
                  : formatNumber(stat.value)}
              </p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
