'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Shield, Gift, Settings, ArrowRight, TrendingUp, Users, Zap, Copy, CheckCircle, ExternalLink, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useState } from 'react';

export default function HomePage() {
  const { t } = useTranslation();
  const { connected } = useWallet();
  const { isAdmin } = useIsAdmin();
  const [copied, setCopied] = useState(false);
  
  const POPCOW_DEFI_ADDRESS = '4sCGHM2NL1nV6fYfWSoCTMwmJDCjfHub9pSpz128pump';
  
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(POPCOW_DEFI_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };
  
  const baseFeatures = [
    {
      name: '质押',
      href: '/staking',
      icon: Coins,
      description: '质押代币获得奖励，Solana 网络最高 25% 年化收益',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      badge: '热门',
      badgeColor: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    },
    {
      name: '保险',
      href: '/insurance',
      icon: Shield,
      description: 'CowGuard 保险保护您的 MEME 资产免受 Rug Pull 和价格暴跌',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      badge: '推荐',
      badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    },
    {
      name: '推荐',
      href: '/referral',
      icon: Gift,
      description: '邀请好友获得 5-15% 返佣，链上奖励自动分配',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      badge: '新功能',
      badgeColor: 'bg-green-500/20 text-green-600 dark:text-green-400',
    },
  ];

  const adminFeature = {
    name: '管理',
    href: '/admin',
    icon: Settings,
    description: '管理面板：代币管理、保险产品、资金分配',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    badge: '管理员',
    badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  };

  // Only include Admin feature if user is admin
  const features = isAdmin ? [...baseFeatures, adminFeature] : baseFeatures;

  const quickStats = [
    { label: '总质押量', value: '$12.5M', change: '+15.3%', icon: TrendingUp },
    { label: '活跃用户', value: '45.2K', change: '+8.7%', icon: Users },
    { label: '平均年化', value: '28.5%', change: '稳定', icon: Zap },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 项目测试提醒 - 购买代币支持项目 */}
      <Alert className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-blue-500/10 border-orange-500/30 border-2">
        <Info className="h-5 w-5 text-orange-500" />
        <AlertTitle className="text-base font-bold flex items-center gap-2">
          <span>🐄 项目测试中</span>
          <Badge variant="outline" className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs">
            测试阶段
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm">
            项目目前处于<strong className="text-orange-500">测试阶段</strong>，欢迎购买 <strong className="text-purple-500">PopCowDefi</strong> 代币支持项目发展！
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-background/50 rounded-lg border border-orange-500/20">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">代币地址</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded border break-all">
                  {POPCOW_DEFI_ADDRESS}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="shrink-0 h-7"
                >
                  {copied ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="shrink-0 h-7"
                >
                  <a
                    href={`https://solscan.io/token/${POPCOW_DEFI_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shrink-0"
              asChild
            >
              <a
                href={`https://pump.fun/${POPCOW_DEFI_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                在 pump.fun 购买
                <ArrowRight className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-blue-500/20 p-8 md:p-12 border border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-background/50">
              🐄 PopCowDefi
            </Badge>
            <Badge variant="outline" className="bg-background/50">
              Solana 网络
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Solana MEME 资产平台
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl">
            提供质押、保险和推荐服务，让您的加密资产更安全、更有价值
          </p>
          {!connected && (
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/staking">
                  开始质押
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/insurance">
                  了解保险
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {connected && (
        <div className="grid gap-4 md:grid-cols-3">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-green-500 mt-1">{stat.change}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      {/* Stats Overview */}
      <StatsOverview />

      {/* Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">核心功能</h2>
          <p className="text-sm text-muted-foreground hidden md:block">
            选择功能开始使用
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.name} href={feature.href}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full border-2 hover:border-primary/50">
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <Badge className={feature.badgeColor}>
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                    >
                      开始使用
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      {!connected && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">准备开始了吗？</h3>
            <p className="text-muted-foreground mb-6">
              连接您的钱包，开启 DeFi 之旅
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/staking">
                  开始质押
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/insurance">
                  购买保险
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
