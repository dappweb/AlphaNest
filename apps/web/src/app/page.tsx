'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { Shield, Coins, TrendingUp, Lock, ArrowRight, Sparkles, Users, Zap, Rocket } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-600 p-4 md:p-8 text-white">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-yellow-400/30 text-white border-0 text-[10px] md:text-xs">
                <Zap className="h-3 w-3 mr-1" />
                BSC Four.meme
              </Badge>
              <Badge className="bg-purple-400/30 text-white border-0 text-[10px] md:text-xs">
                <Rocket className="h-3 w-3 mr-1" />
                SOL pump.fun
              </Badge>
              <Badge className="bg-white/20 text-white border-0 text-[10px] md:text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Early Bird
              </Badge>
            </div>
            <h2 className="text-xl md:text-3xl font-bold">
              Meme Token Staking & Insurance
            </h2>
            <p className="text-white/80 text-sm md:text-base max-w-md">
              Stake & insure your Four.meme (BSC) and pump.fun (Solana) meme tokens!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Link href="/staking">
              <Button size="lg" className="w-full sm:w-auto bg-white text-yellow-600 hover:bg-white/90 font-semibold">
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
        
        {/* 底部平台信息 */}
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xl md:text-2xl font-bold flex items-center gap-1">
              <span className="text-yellow-300">🟡</span> Four.meme
            </p>
            <p className="text-white/70 text-[10px] md:text-xs">BSC Meme Tokens</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold flex items-center gap-1">
              <span className="text-purple-300">🟣</span> pump.fun
            </p>
            <p className="text-white/70 text-[10px] md:text-xs">SOL Meme Tokens</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold">✓ Staking</p>
            <p className="text-white/70 text-[10px] md:text-xs">Both Platforms</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold">✓ Insurance</p>
            <p className="text-white/70 text-[10px] md:text-xs">Rug Protection</p>
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
      <Card className="group border-2 border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/5">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-purple-500 text-white shadow-lg shadow-yellow-500/20">
              <Coins className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg md:text-xl">Meme Token Staking</CardTitle>
                <Badge className="bg-yellow-500/10 text-yellow-500 border-0 text-[10px]">Four.meme</Badge>
                <Badge className="bg-purple-500/10 text-purple-500 border-0 text-[10px]">pump.fun</Badge>
              </div>
              <CardDescription className="text-xs md:text-sm mt-1">
                Stake meme tokens from both platforms
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2 md:p-3 border border-yellow-500/20">
              <p className="text-[10px] md:text-xs text-muted-foreground">🟡 Four.meme (BSC)</p>
              <p className="text-base md:text-lg font-bold text-yellow-500">BNB + Meme</p>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-2 md:p-3 border border-purple-500/20">
              <p className="text-[10px] md:text-xs text-muted-foreground">🟣 pump.fun (SOL)</p>
              <p className="text-base md:text-lg font-bold text-purple-500">SOL + Meme</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">Four.meme</Badge>
            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px]">pump.fun</Badge>
            <Badge variant="outline" className="text-[10px]">10-50% APY</Badge>
          </div>

          <Link href="/staking" className="block">
            <Button className="w-full bg-gradient-to-r from-yellow-500 to-purple-500 hover:from-yellow-600 hover:to-purple-600 group-hover:shadow-lg transition-all">
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
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg md:text-xl">Meme Token Insurance</CardTitle>
                <Badge className="bg-yellow-500/10 text-yellow-500 border-0 text-[10px]">Four.meme</Badge>
                <Badge className="bg-purple-500/10 text-purple-500 border-0 text-[10px]">pump.fun</Badge>
              </div>
              <CardDescription className="text-xs md:text-sm mt-1">
                Insure your meme tokens from both platforms
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2 md:p-3 border border-yellow-500/20">
              <p className="text-[10px] md:text-xs text-muted-foreground">🟡 Four.meme (BSC)</p>
              <p className="text-base md:text-lg font-bold text-yellow-500">100% Cover</p>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-2 md:p-3 border border-purple-500/20">
              <p className="text-[10px] md:text-xs text-muted-foreground">🟣 pump.fun (SOL)</p>
              <p className="text-base md:text-lg font-bold text-purple-500">100% Cover</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">🚨 Rug Pull</Badge>
            <Badge variant="outline" className="text-[10px]">📉 Price Drop</Badge>
            <Badge variant="outline" className="text-[10px]">🔒 Contract Exploit</Badge>
          </div>

          <Link href="/insurance" className="block">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 group-hover:shadow-lg transition-all">
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-yellow-500 to-purple-500 bg-clip-text text-transparent">
            {t.dashboard.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Stake & Insure Meme Tokens from Four.meme & pump.fun
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Zap className="h-3 w-3 mr-1" />
            Four.meme
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">
            <Rocket className="h-3 w-3 mr-1" />
            pump.fun
          </Badge>
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
