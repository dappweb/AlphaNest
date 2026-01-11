'use client';

import { Bot as BotIcon, TrendingUp, Activity, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatUSD } from '@/lib/utils';
import { Bot } from './bot-card';

interface BotsOverviewProps {
  bots: Bot[];
}

export function BotsOverview({ bots }: BotsOverviewProps) {
  const activeBots = bots.filter(b => b.status === 'running').length;
  const totalInvestment = bots.reduce((acc, b) => acc + b.investment, 0);
  const totalValue = bots.reduce((acc, b) => acc + b.currentValue, 0);
  const totalPnl = bots.reduce((acc, b) => acc + b.pnl, 0);
  const totalTrades = bots.reduce((acc, b) => acc + b.trades, 0);
  const pnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

  const stats = [
    {
      name: 'Active Bots',
      value: `${activeBots}/${bots.length}`,
      icon: <BotIcon className="h-5 w-5" />,
      color: 'bg-primary/10 text-primary',
    },
    {
      name: 'Total Investment',
      value: formatUSD(totalInvestment),
      icon: <Wallet className="h-5 w-5" />,
      color: 'bg-blue-500/10 text-blue-400',
    },
    {
      name: 'Total Value',
      value: formatUSD(totalValue),
      subValue: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`,
      subColor: pnlPercent >= 0 ? 'text-success' : 'text-destructive',
      icon: <TrendingUp className="h-5 w-5" />,
      color: pnlPercent >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
    },
    {
      name: 'Total Trades',
      value: totalTrades.toLocaleString(),
      icon: <Activity className="h-5 w-5" />,
      color: 'bg-purple-500/10 text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{stat.value}</p>
                  {stat.subValue && (
                    <span className={`text-sm ${stat.subColor}`}>{stat.subValue}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
