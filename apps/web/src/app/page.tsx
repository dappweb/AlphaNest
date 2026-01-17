'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { Shield, Coins, TrendingUp, Lock, ArrowRight, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 统计卡片 - 响应式优化
function StatsOverview() {
  const stats = [
    {
      title: 'Total Value Locked',
      value: '$2.5M',
      change: '+12.5%',
      icon: Lock,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Active Stakes',
      value: '1,234',
      change: '+8.2%',
      icon: Coins,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Insurance Policies',
      value: '456',
      change: '+15.3%',
      icon: Shield,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'APY',
      value: '25%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-green-500 font-medium">
                  {stat.change}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg} hidden sm:block`}>
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Hero Banner - 移动端优化
function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600 p-4 md:p-8 text-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Early Bird Bonus Active
              </Badge>
            </div>
            <h2 className="text-xl md:text-3xl font-bold">
              Stake & Earn Up to 50% APY
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-md">
              Multi-asset staking with flexible lock periods. Higher locks = Higher rewards!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Link href="/staking">
              <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-white/90 font-semibold">
                <Coins className="h-4 w-4 mr-2" />
                Start Staking
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/insurance">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                <Shield className="h-4 w-4 mr-2" />
                Get Protected
              </Button>
            </Link>
          </div>
        </div>
        
        {/* 底部统计 - 移动端隐藏部分 */}
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/20 grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl md:text-3xl font-bold">5x</p>
            <p className="text-white/70 text-[10px] md:text-xs">Max Multiplier</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold">+50%</p>
            <p className="text-white/70 text-[10px] md:text-xs">Early Bird Bonus</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold">4+</p>
            <p className="text-white/70 text-[10px] md:text-xs">Supported Assets</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 功能入口卡片 - 响应式优化
function FeatureCards() {
  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
      {/* 质押卡片 */}
      <Card className="group border-2 border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20">
              <Coins className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg md:text-xl">Multi-Asset Staking</CardTitle>
                <Badge className="bg-orange-500/10 text-orange-500 border-0 text-[10px]">HOT</Badge>
              </div>
              <CardDescription className="text-xs md:text-sm mt-1">
                Stake ETH, USDC, USDT and earn rewards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-lg bg-secondary/50 p-2 md:p-3">
              <p className="text-[10px] md:text-xs text-muted-foreground">Base APY</p>
              <p className="text-base md:text-lg font-bold text-green-500">10-50%</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 md:p-3">
              <p className="text-[10px] md:text-xs text-muted-foreground">Lock Periods</p>
              <p className="text-base md:text-lg font-bold">5 Options</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">Flexible</Badge>
            <Badge variant="outline" className="text-[10px]">30 Days</Badge>
            <Badge variant="outline" className="text-[10px]">90 Days</Badge>
            <Badge variant="outline" className="text-[10px]">180 Days</Badge>
            <Badge variant="outline" className="text-[10px]">365 Days</Badge>
          </div>

          <Link href="/staking" className="block">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 group-hover:shadow-lg transition-all">
              Start Staking
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 保险卡片 */}
      <Card className="group border-2 border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg md:text-xl">CowGuard Insurance</CardTitle>
                <Badge className="bg-blue-500/10 text-blue-500 border-0 text-[10px]">NEW</Badge>
              </div>
              <CardDescription className="text-xs md:text-sm mt-1">
                Protect your assets from rug pulls & risks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-lg bg-secondary/50 p-2 md:p-3">
              <p className="text-[10px] md:text-xs text-muted-foreground">Active Policies</p>
              <p className="text-base md:text-lg font-bold">456</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 md:p-3">
              <p className="text-[10px] md:text-xs text-muted-foreground">Coverage Rate</p>
              <p className="text-base md:text-lg font-bold text-blue-500">Up to 100%</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">🚨 Rug Pull</Badge>
            <Badge variant="outline" className="text-[10px]">📉 Price Drop</Badge>
            <Badge variant="outline" className="text-[10px]">🔒 Smart Contract</Badge>
            <Badge variant="outline" className="text-[10px]">🛡️ Comprehensive</Badge>
          </div>

          <Link href="/insurance" className="block">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 group-hover:shadow-lg transition-all">
              Get Insurance
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// 底部信息卡片
function InfoCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
        <CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Status</p>
            <p className="text-xs md:text-sm font-medium text-green-500">All Systems Go</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
        <CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Users</p>
            <p className="text-xs md:text-sm font-medium">2,500+</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
        <CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Coins className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Rewards Paid</p>
            <p className="text-xs md:text-sm font-medium">$125K+</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
        <CardContent className="p-3 md:p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Shield className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Claims Paid</p>
            <p className="text-xs md:text-sm font-medium">$50K+</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* 页面标题 - 移动端简化 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            {t.dashboard.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Stake & Insure - Protect and grow your assets
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <HeroBanner />

      {/* 统计概览 */}
      <Suspense fallback={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      }>
        <StatsOverview />
      </Suspense>

      {/* 功能入口 */}
      <FeatureCards />

      {/* 底部信息 */}
      <InfoCards />
    </div>
  );
}
