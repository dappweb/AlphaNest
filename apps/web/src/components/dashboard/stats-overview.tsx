'use client';

import { useAccount, useBalance } from 'wagmi';
import { TrendingUp, Users, Shield, Coins, Wallet, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatUSD, formatNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Loading } from '@/components/ui/loading';

// Platform-wide stats will be fetched from API

export function StatsOverview() {
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [hideBalance, setHideBalance] = useState(false);
  const [userStats, setUserStats] = useState({
    portfolioValue: 0,
    portfolioChange: 0,
    pointsBalance: 0,
    activePolicies: 0,
  });
  const [platformStats, setPlatformStats] = useState<Array<{
    name: string;
    value: number;
    change: number;
    icon: typeof TrendingUp;
    format: 'usd' | 'number' | 'percent' | 'string';
  }>>([]);
  const [isLoadingPlatform, setIsLoadingPlatform] = useState(true);

  // Load user preference for hiding balance
  useEffect(() => {
    const settings = localStorage.getItem('alphanest-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setHideBalance(parsed.hideBalance || false);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Calculate user stats when connected
  useEffect(() => {
    if (isConnected && balance && address) {
      const fetchUserStats = async () => {
        try {
          // Fetch portfolio value from token balances
          const holdingsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev'}/api/v1/blockchain/balance?address=${address}&token=0x0000000000000000000000000000000000000000&chainId=1`
          );
          
          // Fetch points balance
          // TODO: Use usePointsInfo hook when available
          const pointsBalance = 0; // Will be fetched from contract
          
          // Fetch active policies count
          // TODO: Use useUserPolicies hook
          const activePolicies = 0;

          const ethValue = parseFloat(balance.formatted) * 3500; // Approximate ETH price
          
          setUserStats({
            portfolioValue: ethValue, // Will be updated with token balances
            portfolioChange: 8.5, // TODO: Calculate from historical data
            pointsBalance,
            activePolicies,
          });
        } catch (err) {
          console.error('Error fetching user stats:', err);
          // Fallback to basic calculation
          const ethValue = parseFloat(balance.formatted) * 3500;
          setUserStats({
            portfolioValue: ethValue,
            portfolioChange: 0,
            pointsBalance: 0,
            activePolicies: 0,
          });
        }
      };

      fetchUserStats();
    } else {
      setUserStats({
        portfolioValue: 0,
        portfolioChange: 0,
        pointsBalance: 0,
        activePolicies: 0,
      });
    }
  }, [isConnected, balance, address]);

  // Fetch platform stats
  useEffect(() => {
    const fetchPlatformStats = async () => {
      setIsLoadingPlatform(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev'}/api/v1/analytics/platform`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            setPlatformStats([
  {
    name: 'Total Volume (24h)',
                value: data.totalVolume || 0,
                change: 12.5, // TODO: Calculate from historical data
    icon: TrendingUp,
    format: 'usd',
  },
  {
    name: 'Active Devs',
                value: 0, // Not available from API yet
    change: 8.2,
    icon: Users,
    format: 'number',
  },
  {
    name: 'Insurance TVL',
                value: data.tvl || 0,
    change: -2.1,
    icon: Shield,
    format: 'usd',
  },
  {
    name: 'Total Points Distributed',
                value: 0, // Not available from API yet
    change: 15.3,
    icon: Coins,
    format: 'number',
  },
            ]);
          }
        }
      } catch (err) {
        console.error('Error fetching platform stats:', err);
      } finally {
        setIsLoadingPlatform(false);
      }
    };

    fetchPlatformStats();
  }, []);

  const formatValue = (value: number, hide: boolean) => {
    if (hide) return '****';
    return formatUSD(value);
  };

  // Show user stats when connected
  if (isConnected) {
    return (
      <div className="space-y-4">
        {/* User Stats Row */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Overview</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setHideBalance(!hideBalance)}
          >
            {hideBalance ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {hideBalance ? 'Show' : 'Hide'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Portfolio Value */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <span className={`text-sm font-medium ${
                  userStats.portfolioChange >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {userStats.portfolioChange >= 0 ? '+' : ''}
                  {userStats.portfolioChange}%
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {formatValue(userStats.portfolioValue, hideBalance)}
                </p>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
              </div>
            </CardContent>
          </Card>

          {/* ETH Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {hideBalance ? '****' : `${parseFloat(balance?.formatted || '0').toFixed(4)} ${balance?.symbol || 'ETH'}`}
                </p>
                <p className="text-sm text-muted-foreground">Native Balance</p>
              </div>
            </CardContent>
          </Card>

          {/* Points Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Coins className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {hideBalance ? '****' : formatNumber(userStats.pointsBalance)}
                </p>
                <p className="text-sm text-muted-foreground">Points Balance</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Policies */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{userStats.activePolicies}</p>
                <p className="text-sm text-muted-foreground">Active Policies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <h2 className="text-lg font-semibold mt-6">Platform Stats</h2>
        {isLoadingPlatform ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Loading size="sm" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platformStats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      stat.change >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {stat.change >= 0 ? '+' : ''}
                    {stat.change}%
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">
                    {stat.format === 'usd'
                      ? formatUSD(stat.value)
                      : formatNumber(stat.value)}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show only platform stats when not connected
  return (
    <>
      {isLoadingPlatform ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Loading size="sm" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformStats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.change >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {stat.change >= 0 ? '+' : ''}
                {stat.change}%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">
                {stat.format === 'usd'
                  ? formatUSD(stat.value)
                  : formatNumber(stat.value)}
              </p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
      )}
    </>
  );
}
