'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { StakingBanner } from '@/components/dashboard/staking-banner';
import { useTranslation } from '@/hooks/use-translation';
import { StatsCardSkeleton } from '@/components/ui/skeleton';
import { Shield, Coins, TrendingUp, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 简化的统计卡片
function SimpleStatsOverview() {
  const stats = [
    {
      title: 'Total Value Locked',
      value: '$2.5M',
      change: '+12.5%',
      icon: Lock,
    },
    {
      title: 'Active Stakes',
      value: '1,234',
      change: '+8.2%',
      icon: Coins,
    },
    {
      title: 'Insurance Policies',
      value: '456',
      change: '+15.3%',
      icon: Shield,
    },
    {
      title: 'APY',
      value: '25%',
      change: '+2.1%',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-green-500">{stat.change} from last week</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 功能入口卡片
function FeatureCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 质押卡片 */}
      <Card className="border-2 border-orange-500/20 hover:border-orange-500/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Coins className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-xl">🔥 Staking</CardTitle>
              <CardDescription>Stake tokens and earn rewards</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current APY</span>
            <span className="font-bold text-green-500">25%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Staked</span>
            <span className="font-bold">$1.8M</span>
          </div>
          <Link href="/staking">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Start Staking
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 保险卡片 */}
      <Card className="border-2 border-blue-500/20 hover:border-blue-500/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl">🛡️ Insurance</CardTitle>
              <CardDescription>Protect your assets from risks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Policies</span>
            <span className="font-bold">456</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Coverage</span>
            <span className="font-bold">$750K</span>
          </div>
          <Link href="/insurance">
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              Get Insurance
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            {t.dashboard.title}
          </h1>
          <p className="text-muted-foreground">
            Stake & Insure - Protect and grow your assets
          </p>
        </div>
      </div>

      {/* 质押挖矿入口 */}
      <Suspense fallback={<div className="h-32 bg-muted rounded-lg animate-pulse" />}>
        <StakingBanner />
      </Suspense>

      {/* 统计概览 */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      }>
        <SimpleStatsOverview />
      </Suspense>

      {/* 功能入口 */}
      <FeatureCards />
    </div>
  );
}
