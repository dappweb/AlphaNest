'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Shield, Gift, Settings, ArrowRight, TrendingUp, Users, Zap, Copy, CheckCircle, ExternalLink } from 'lucide-react';
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
      name: 'Staking',
      href: '/staking',
      icon: Coins,
      description: 'Stake tokens to earn rewards on Solana, up to 25% APY',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      badge: 'Hot',
      badgeColor: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    },
    {
      name: 'Insurance',
      href: '/insurance',
      icon: Shield,
      description: 'CowGuard insurance protects your MEME assets from rug pulls and price crashes',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      badge: 'Recommended',
      badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Referral',
      href: '/referral',
      icon: Gift,
      description: 'Invite friends and earn 5-15% commission, on-chain rewards auto-distributed',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      badge: 'NEW',
      badgeColor: 'bg-green-500/20 text-green-600 dark:text-green-400',
    },
  ];

  const adminFeature = {
    name: 'Admin',
    href: '/admin',
    icon: Settings,
    description: 'Admin dashboard: Token management, insurance products, fund allocation',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    badge: 'Admin',
    badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  };

  // Only include Admin feature if user is admin
  const features = isAdmin ? [...baseFeatures, adminFeature] : baseFeatures;

  const quickStats = [
    { label: 'Total Staked', value: '$12.5M', change: '+15.3%', icon: TrendingUp },
    { label: 'Active Users', value: '45.2K', change: '+8.7%', icon: Users },
    { label: 'Average APY', value: '28.5%', change: 'Stable', icon: Zap },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-blue-500/20 p-8 md:p-12 border border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="bg-background/50">
              🐄 PopCowDefi
            </Badge>
            <Badge variant="outline" className="bg-background/50">
              Solana Network
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Solana MEME Asset Platform
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl">
            Providing staking, insurance, and referral services to make your crypto assets safer and more valuable
          </p>
          {!connected && (
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/staking">
                  Start Staking
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/insurance">
                  Learn About Insurance
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

      {/* PopCowDefi Address */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                  🐄 PopCowDefi Token
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Contract Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-secondary/50 px-3 py-2 rounded border break-all">
                  {POPCOW_DEFI_ADDRESS}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAddress}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="shrink-0"
                >
                  <a
                    href={`https://solscan.io/token/${POPCOW_DEFI_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Core Features</h2>
          <p className="text-sm text-muted-foreground hidden md:block">
            Select a feature to get started
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
                      Get Started
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
            <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to begin your DeFi journey
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/staking">
                  Start Staking
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/insurance">
                  Buy Insurance
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
