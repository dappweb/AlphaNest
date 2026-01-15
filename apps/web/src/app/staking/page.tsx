'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { StakingCard, StakingStats } from '@/components/staking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  ArrowRight, 
  ExternalLink,
  Info,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

export default function StakingPage() {
  const { isConnected } = useAccount();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  // 模拟数据 - 待接入实际合约
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({
    POPCOW: 1000000,
    SOL: 10.5,
    USDC: 5000,
    USDT: 3000,
    BONK: 50000000,
    JUP: 500,
    RAY: 100,
  });
  const [popCowDefiBalance, setPopCowDefiBalance] = useState(0);
  const [stakedAmounts, setStakedAmounts] = useState<Record<string, number>>({});
  const [pendingRewards, setPendingRewards] = useState(0);

  // 全局统计
  const [globalStats, setGlobalStats] = useState({
    totalStaked: 125000000,
    totalStakers: 1234,
    totalRewardsDistributed: 5600000,
    averageApy: 116,
  });

  const handleStake = async (amount: number, poolId: number, tokenSymbol: string) => {
    setIsLoading(true);
    try {
      console.log('Staking', amount, tokenSymbol, 'to pool', poolId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTokenBalances(prev => ({
        ...prev,
        [tokenSymbol]: (prev[tokenSymbol] || 0) - amount,
      }));
      setStakedAmounts(prev => ({
        ...prev,
        [tokenSymbol]: (prev[tokenSymbol] || 0) + amount,
      }));
    } catch (error) {
      console.error('Stake failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (amount: number, poolId: number, tokenSymbol: string) => {
    setIsLoading(true);
    try {
      console.log('Unstaking', amount, tokenSymbol, 'from pool', poolId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStakedAmounts(prev => ({
        ...prev,
        [tokenSymbol]: (prev[tokenSymbol] || 0) - amount,
      }));
      setTokenBalances(prev => ({
        ...prev,
        [tokenSymbol]: (prev[tokenSymbol] || 0) + amount,
      }));
    } catch (error) {
      console.error('Unstake failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (poolId: number) => {
    setIsLoading(true);
    try {
      console.log('Claiming rewards from pool', poolId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPopCowDefiBalance(prev => prev + pendingRewards);
      setPendingRewards(0);
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟奖励累积
  const totalStaked = Object.values(stakedAmounts).reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (totalStaked > 0) {
      const interval = setInterval(() => {
        setPendingRewards(prev => prev + totalStaked * 0.0001);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [totalStaked]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-orange-500" />
            {t.staking.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.staking.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <Shield className="h-3 w-3 mr-1" />
            {t.staking.contractAudited}
          </Badge>
          <Link
            href="https://solscan.io/token/8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump"
            target="_blank"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              POPCOW 代币
            </Button>
          </Link>
        </div>
      </div>

      {/* 全局统计 */}
      <StakingStats {...globalStats} />

      {/* 主要内容 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 质押卡片 */}
        <div className="lg:col-span-2">
          <StakingCard
            tokenBalances={tokenBalances}
            popCowDefiBalance={popCowDefiBalance}
            stakedAmounts={stakedAmounts}
            pendingRewards={pendingRewards}
            onStake={handleStake}
            onUnstake={handleUnstake}
            onClaim={handleClaim}
            isLoading={isLoading}
            isConnected={isConnected}
          />
        </div>

        {/* 侧边信息 */}
        <div className="space-y-4">
          {/* 代币兑换流程 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-orange-500" />
                {t.staking.tokenExchange}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
                  🐄
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">POPCOW 代币</p>
                  <p className="text-xs text-muted-foreground">引流代币</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-5 w-5 text-orange-500 rotate-90" />
                  <span className="text-xs text-muted-foreground">{t.staking.stakingMining}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-lg">
                  ⭐
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">$PopCowDefi</p>
                  <p className="text-xs text-muted-foreground">{t.staking.platformToken}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* $PopCowDefi 权益 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                {t.staking.benefits}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>{t.staking.feeShare}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>{t.staking.governance}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Coins className="h-4 w-4 text-orange-500 mt-0.5" />
                  <span>{t.staking.feeDiscount}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-purple-500 mt-0.5" />
                  <span>{t.staking.alphaPriority}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 购买 POPCOW 代币 */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Info className="h-5 w-5 text-orange-500" />
                <p className="text-sm font-medium">{t.staking.noTokens}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t.staking.buyTokens}
              </p>
              <div className="flex gap-2">
                <Link
                  href="https://pump.fun/coin/8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump"
                  target="_blank"
                  className="flex-1"
                >
                  <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                    Pump.fun
                  </Button>
                </Link>
                <Link
                  href="https://raydium.io/swap"
                  target="_blank"
                  className="flex-1"
                >
                  <Button size="sm" variant="outline" className="w-full">
                    Raydium
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
