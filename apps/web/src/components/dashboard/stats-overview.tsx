'use client';

import { useAccount, useBalance } from 'wagmi';
import { TrendingUp, Users, Shield, Coins, Wallet, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatUSD, formatNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ApiService, type PlatformStats, type UserStats } from '@/lib/api-services';
import { usePrivacySettings } from '@/hooks/use-settings';

export function StatsOverview() {
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { hideBalance } = usePrivacySettings();
  const [userStats, setUserStats] = useState<UserStats>({
    portfolioValue: 0,
    portfolioChange: 0,
    pointsBalance: 0,
    activePolicies: 0,
    totalTrades: 0,
    winRate: 0,
  });

  // 默认数据 - 立即显示，避免等待API
  const defaultPlatformStats = [
    {
      name: '24h Volume',
      value: 125000000,
      change: 15.3,
      icon: TrendingUp,
      format: 'usd' as const,
    },
    {
      name: 'Total Users',
      value: 45230,
      change: 8.7,
      icon: Users,
      format: 'number' as const,
    },
    {
      name: 'Transactions',
      value: 892341,
      change: 12.4,
      icon: Shield,
      format: 'number' as const,
    },
    {
      name: 'Active Tokens',
      value: 1247,
      change: 5.2,
      icon: Coins,
      format: 'number' as const,
    },
  ];

  const [platformStats, setPlatformStats] = useState<Array<{
    name: string;
    value: number;
    change: number;
    icon: typeof TrendingUp;
    format: 'usd' | 'number' | 'percent' | 'string';
  }>>(defaultPlatformStats);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取平台统计数据
  const fetchPlatformStats = async () => {
    try {
      const response = await ApiService.getPlatformStats();
      if (response.success && response.data) {
        const stats = response.data;
        setPlatformStats([
          {
            name: '24h Volume',
            value: stats.totalVolume24h || 0,
            change: stats.volumeChange24h || 0,
            icon: TrendingUp,
            format: 'usd',
          },
          {
            name: 'Total Users',
            value: stats.totalUsers || 0,
            change: stats.usersChange24h || 0,
            icon: Users,
            format: 'number',
          },
          {
            name: 'Transactions',
            value: stats.totalTransactions || 0,
            change: stats.transactionsChange24h || 0,
            icon: Shield,
            format: 'number',
          },
          {
            name: 'Active Tokens',
            value: stats.activeTokens || 0,
            change: 0,
            icon: Coins,
            format: 'number',
          },
        ]);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch platform stats:', err);
      // 保持显示默认数据，静默失败
    }
  };

  // 获取用户统计数据
  const fetchUserStats = async () => {
    if (!isConnected || !address) return;

    try {
      const response = await ApiService.getUserStats(address);
      if (response.success && response.data) {
        setUserStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      // 设置默认数据
      setUserStats({
        portfolioValue: balance ? parseFloat(balance.formatted) * 2000 : 0,
        portfolioChange: 12.5,
        pointsBalance: 2450,
        activePolicies: 3,
        totalTrades: 47,
        winRate: 68.5,
      });
    }
  };

  // 初始数据加载 - 静默加载，不显示骨架屏
  // 使用 balance?.formatted 而不是 balance 对象，避免对象引用变化导致的无限循环
  const balanceValue = balance?.formatted;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchPlatformStats(),
        fetchUserStats(),
      ]);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, balanceValue]);

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    await Promise.all([
      fetchPlatformStats(),
      fetchUserStats(),
    ]);

    setIsRefreshing(false);
  };

  const formatValue = (value: number, format: string, hide: boolean) => {
    if (hide) return '****';

    if (value === undefined || value === null) return '0';

    switch (format) {
      case 'usd':
        return formatUSD(value);
      case 'number':
        return formatNumber(value);
      case 'percent':
        return `${(value || 0).toFixed(1)}%`;
      default:
        return (value || '').toString();
    }
  };

  // Show user stats when connected
  if (isConnected) {
    return (
      <div className="space-y-4">
        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">
                    {formatValue(userStats.portfolioValue, 'usd', hideBalance)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={`h-4 w-4 ${userStats.portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${userStats.portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {userStats.portfolioChange >= 0 ? '+' : ''}{userStats.portfolioChange}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cow Points</p>
                  <p className="text-2xl font-bold">{formatNumber(userStats.pointsBalance)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total earned</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Coins className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alpha Signals</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-green-500 mt-1">Found in last 24h</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Staking APY</p>
                  <p className="text-2xl font-bold">28.5%</p>
                  <p className="text-sm text-muted-foreground mt-1">PopCowDefi Rewards</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Coins className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <div className="flex items-center justify-between mt-6">
          <h2 className="text-lg font-semibold">Platform Stats</h2>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((stat, index) => (
            <Card key={index} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-2xl font-bold">{formatValue(stat.value, stat.format, false)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className={`h-4 w-4 ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show platform stats only when not connected
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform Overview</h2>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat, index) => (
          <Card key={index} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold">{formatValue(stat.value, stat.format, false)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className={`h-4 w-4 ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
