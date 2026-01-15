'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Percent,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StakingStatsProps {
  totalStaked: number;
  totalStakers: number;
  totalRewardsDistributed: number;
  averageApy: number;
}

export function StakingStats({
  totalStaked = 0,
  totalStakers = 0,
  totalRewardsDistributed = 0,
  averageApy = 100,
}: StakingStatsProps) {
  const stats = [
    {
      label: '总质押量',
      value: totalStaked.toLocaleString(),
      suffix: 'Pump',
      icon: Coins,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      change: '+12.5%',
      changePositive: true,
    },
    {
      label: '质押用户数',
      value: totalStakers.toLocaleString(),
      suffix: '人',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: '+8.2%',
      changePositive: true,
    },
    {
      label: '已发放奖励',
      value: totalRewardsDistributed.toLocaleString(),
      suffix: '$PopCowDefi',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: '+24.8%',
      changePositive: true,
    },
    {
      label: '平均 APY',
      value: averageApy.toString(),
      suffix: '%',
      icon: Percent,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      change: '稳定',
      changePositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} variant="interactive" className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={cn('rounded-lg p-2', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpRight className={cn(
                  'h-3 w-3',
                  stat.changePositive ? 'text-green-500' : 'text-red-500'
                )} />
                <span className={stat.changePositive ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">
                {stat.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {stat.suffix}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
