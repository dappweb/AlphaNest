'use client';

import { Shield, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatUSD } from '@/lib/utils';

const stats = [
  {
    label: 'Total Coverage',
    value: 12500000,
    icon: Shield,
    format: 'usd',
  },
  {
    label: 'Active Policies',
    value: 3456,
    icon: Users,
    format: 'number',
  },
  {
    label: 'Claims Paid',
    value: 2340000,
    icon: TrendingUp,
    format: 'usd',
  },
];

export function InsuranceHero() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AlphaGuard Insurance</h1>
        <p className="mt-2 text-muted-foreground">
          Protect your investments against Rug Pulls with parametric insurance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">
                  {stat.format === 'usd'
                    ? formatUSD(stat.value)
                    : stat.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
