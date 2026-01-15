'use client';

import { useAccount, useBalance } from 'wagmi';
import { TrendingUp, Users, Shield, Coins, Wallet, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatUSD, formatNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ApiService, type PlatformStats, type UserStats } from '@/lib/api-services';
import { StatsCardSkeleton } from '@/components/ui/skeleton';
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
  const [platformStats, setPlatformStats] = useState<Array<{
    name: string;
    value: number;
    change: number;
    icon: typeof TrendingUp;
    format: 'usd' | 'number' | 'percent' | 'string';
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
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
            value: stats.totalVolume24h,
            change: stats.volumeChange24h,
            icon: TrendingUp,
            format: 'usd',
          },
          {
            name: 'Total Users',
            value: stats.totalUsers,
            change: stats.usersChange24h,
            icon: Users,
            format: 'number',
          },
          {
            name: 'Transactions',
            value: stats.totalTransactions,
            change: stats.transactionsChange24h,
            icon: Shield,
            format: 'number',
          },
          {
            name: 'Active Tokens',
            value: stats.activeTokens,
            change: 0,
            icon: Coins,
            format: 'number',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch platform stats:', err);
      setError('Failed to load platform statistics');
      // 设置默认数据
      setPlatformStats([
        {
          name: '24h Volume',
          value: 125000000,
          change: 15.3,
          icon: TrendingUp,
          format: 'usd',
        },
        {
          name: 'Total Users',
          value: 45230,
          change: 8.7,
          icon: Users,
          format: 'number',
        },
        {
          name: 'Transactions',
          value: 892341,
          change: 12.4,
          icon: Shield,
          format: 'number',
        },
        {
          name: 'Active Tokens',
          value: 1247,
          change: 5.2,
          icon: Coins,
          format: 'number',
        },
      ]);
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

  // 初始数据加载
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      await Promise.all([
        fetchPlatformStats(),
        fetchUserStats(),
      ]);
      
      setIsLoading(false);
    };

    loadData();
  }, [isConnected, address, balance]);

  // 刷新数据
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    await Promise.all([
      fetchPlatformStats(),
      fetchUserStats(),
    ]);
    
    setIsLoading(false);
  };

  const formatValue = (value: number, format: string, hide: boolean) => {
    if (hide) return '****';
    
    switch (format) {
      case 'usd':
        return formatUSD(value);
      case 'number':
        return formatNumber(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
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
                  <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{userStats.totalTrades}</p>
                  <p className="text-sm text-muted-foreground mt-1">Win Rate: {userStats.winRate}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Wallet className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Insurance</p>
                  <p className="text-2xl font-bold">{userStats.activePolicies}</p>
                  <p className="text-sm text-muted-foreground mt-1">Active Policies</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <div className="flex items-center justify-between mt-6">
          <h2 className="text-lg font-semibold">Platform Stats</h2>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
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

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
          </div>
        ) : (
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
        )}
      </div>
    );
  }

  // Show platform stats only when not connected
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform Overview</h2>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? (
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </Button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
