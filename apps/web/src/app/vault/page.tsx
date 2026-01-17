'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Coins,
  Lock,
  Unlock,
  TrendingUp,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
  Calculator,
  Wallet,
  Gift,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSolanaStaking } from '@/hooks/use-solana-staking';

// 质押池配置
const VAULT_POOLS = [
  {
    id: 0,
    name: '灵活质押',
    icon: '🌊',
    lockDays: 0,
    apy: 5,
    multiplier: 1,
    description: '随时存取，收益稳定',
    color: 'from-blue-500 to-cyan-500',
    badge: '灵活',
  },
  {
    id: 1,
    name: '铜牛池',
    icon: '🥉',
    lockDays: 30,
    apy: 12,
    multiplier: 2.4,
    description: '30天锁定，2.4倍收益',
    color: 'from-amber-600 to-orange-500',
    badge: '入门',
  },
  {
    id: 2,
    name: '银牛池',
    icon: '🥈',
    lockDays: 90,
    apy: 20,
    multiplier: 4,
    description: '90天锁定，4倍收益',
    color: 'from-gray-400 to-gray-300',
    badge: '标准',
  },
  {
    id: 3,
    name: '金牛池',
    icon: '🥇',
    lockDays: 180,
    apy: 35,
    multiplier: 7,
    description: '180天锁定，7倍收益',
    color: 'from-yellow-500 to-amber-400',
    badge: '高收益',
    popular: true,
  },
  {
    id: 4,
    name: '钻石牛池',
    icon: '💎',
    lockDays: 365,
    apy: 50,
    multiplier: 10,
    description: '365天锁定，10倍收益',
    color: 'from-purple-500 to-pink-500',
    badge: '最高收益',
  },
];

// 代币信息
const TOKENS = {
  POPCOW: {
    symbol: 'POPCOW',
    name: 'PopCow',
    icon: '🐄',
    address: '8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump',
    decimals: 6,
  },
  POPCOW_DEFI: {
    symbol: 'POPCOW DEFI',
    name: 'PopCow DeFi',
    icon: '💎',
    address: '4sCGHM2NL1nV6fYfWSoCTMwmJDCjfHub9pSpz128pump',
    decimals: 6,
  },
};

export default function VaultPage() {
  const { connected, publicKey } = useWallet();
  const { tokenBalances, positions, isLoading, stake, unstake, claimRewards, refetch } = useSolanaStaking();
  
  const [selectedPool, setSelectedPool] = useState(3); // 默认选择金牛池
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stake');
  const [showCalculator, setShowCalculator] = useState(false);

  // 计算统计数据
  const totalStaked = positions.reduce((sum, p) => sum + p.stakedAmount, 0);
  const pendingRewards = positions.reduce((sum, p) => sum + p.pendingRewards, 0);
  const popcowBalance = tokenBalances.POPCOW || 0;
  const defiBalance = tokenBalances.PopCowDefi || 0;

  const currentPool = VAULT_POOLS.find(p => p.id === selectedPool) || VAULT_POOLS[3];

  // 计算预估收益
  const calculateRewards = (amount: number, days: number, apy: number) => {
    const daily = (amount * (apy / 100)) / 365;
    const total = daily * days;
    return { daily, total };
  };

  const stakeValue = Number(stakeAmount) || 0;
  const estimatedRewards = calculateRewards(
    stakeValue,
    currentPool.lockDays || 30,
    currentPool.apy
  );

  // 处理质押
  const handleStake = async () => {
    if (!connected || stakeValue <= 0 || stakeValue > popcowBalance) return;
    try {
      // TODO: 实际调用合约
      console.log('Staking', stakeValue, 'to pool', selectedPool);
      setStakeAmount('');
      await refetch();
    } catch (error) {
      console.error('Stake failed:', error);
    }
  };

  // 处理解锁
  const handleUnstake = async () => {
    const amount = Number(unstakeAmount);
    if (!connected || amount <= 0 || amount > totalStaked) return;
    try {
      // TODO: 实际调用合约
      console.log('Unstaking', amount, 'from pool', selectedPool);
      setUnstakeAmount('');
      await refetch();
    } catch (error) {
      console.error('Unstake failed:', error);
    }
  };

  // 处理领取奖励
  const handleClaim = async () => {
    if (!connected || pendingRewards <= 0) return;
    try {
      // TODO: 实际调用合约
      console.log('Claiming rewards');
      await refetch();
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">🐄</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              POP Vault
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            质押 POPCOW 代币，获得 POPCOW DEFI 奖励。选择锁定期越长，收益越高！
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Shield className="h-3 w-3 mr-1" />
              合约已审计
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              1:2 兑换比例
            </Badge>
          </div>
        </div>

        {/* 全局统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">总锁仓量</p>
              <p className="text-2xl font-bold text-orange-500">125.6M</p>
              <p className="text-xs text-muted-foreground">POPCOW</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">已分发奖励</p>
              <p className="text-2xl font-bold text-green-500">5.6M</p>
              <p className="text-xs text-muted-foreground">POPCOW DEFI</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">质押用户</p>
              <p className="text-2xl font-bold text-blue-500">1,234</p>
              <p className="text-xs text-muted-foreground">钱包地址</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">平均 APY</p>
              <p className="text-2xl font-bold text-purple-500">~24%</p>
              <p className="text-xs text-muted-foreground">年化收益</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：质押池选择 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 质押池卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-orange-500" />
                  选择质押池
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {VAULT_POOLS.map((pool) => (
                    <button
                      key={pool.id}
                      onClick={() => setSelectedPool(pool.id)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-left',
                        selectedPool === pool.id
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                          : 'border-border hover:border-orange-500/50 hover:bg-secondary/50'
                      )}
                    >
                      {pool.popular && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-orange-500 text-white text-[10px]">
                            推荐
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{pool.icon}</span>
                        <div>
                          <p className="font-semibold">{pool.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {pool.badge}
                          </Badge>
                        </div>
                      </div>
                      <div className={cn(
                        'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                        pool.color
                      )}>
                        {pool.apy}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">APY</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        {pool.lockDays > 0 ? (
                          <>
                            <Lock className="h-3 w-3" />
                            <span>锁定 {pool.lockDays} 天</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">灵活存取</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{pool.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 质押操作 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{currentPool.icon}</span>
                    {currentPool.name}
                  </CardTitle>
                  <Badge className={cn('bg-gradient-to-r text-white', currentPool.color)}>
                    {currentPool.apy}% APY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 余额显示 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🐄</span>
                      <span className="text-sm text-muted-foreground">POPCOW 余额</span>
                    </div>
                    <p className="text-2xl font-bold">{popcowBalance.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💎</span>
                      <span className="text-sm text-muted-foreground">POPCOW DEFI</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-500">{defiBalance.toLocaleString()}</p>
                  </div>
                </div>

                {/* 质押/解锁 Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stake">
                      <Lock className="h-4 w-4 mr-2" />
                      质押
                    </TabsTrigger>
                    <TabsTrigger value="unstake">
                      <Unlock className="h-4 w-4 mr-2" />
                      解锁
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stake" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">质押数量</label>
                        <button
                          onClick={() => setStakeAmount(popcowBalance.toString())}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          最大: {popcowBalance.toLocaleString()}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="输入质押数量"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleStake}
                          disabled={!connected || isLoading || stakeValue <= 0 || stakeValue > popcowBalance}
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                        >
                          质押
                        </Button>
                      </div>
                    </div>

                    {/* 预估收益 */}
                    {stakeValue > 0 && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">预估收益</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">每日收益</p>
                            <p className="text-lg font-bold">{estimatedRewards.daily.toFixed(4)} DEFI</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {currentPool.lockDays > 0 ? `${currentPool.lockDays}天` : '30天'}总收益
                            </p>
                            <p className="text-lg font-bold text-green-500">
                              {estimatedRewards.total.toFixed(2)} DEFI
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentPool.lockDays > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 text-xs">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>
                          锁定期内提前解锁将放弃所有待领取奖励。请确认您已了解风险。
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="unstake" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">解锁数量</label>
                        <button
                          onClick={() => setUnstakeAmount(totalStaked.toString())}
                          className="text-xs text-orange-500 hover:underline"
                        >
                          已质押: {totalStaked.toLocaleString()}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="输入解锁数量"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleUnstake}
                          disabled={!connected || isLoading || Number(unstakeAmount) <= 0}
                          variant="outline"
                        >
                          解锁
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：用户状态 */}
          <div className="space-y-4">
            {/* 我的质押 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-orange-500" />
                  我的质押
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-yellow-500/20">
                  <p className="text-sm text-muted-foreground">总质押量</p>
                  <p className="text-3xl font-bold">{totalStaked.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">POPCOW</p>
                </div>

                {/* 待领取奖励 */}
                <div className="p-4 rounded-lg border bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">待领取奖励</span>
                    <Gift className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">{pendingRewards.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mb-3">POPCOW DEFI</p>
                  <Button
                    onClick={handleClaim}
                    disabled={!connected || pendingRewards <= 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    领取奖励
                  </Button>
                </div>

                {!connected && (
                  <div className="text-center p-4 rounded-lg border border-dashed">
                    <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">请连接钱包查看您的质押</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 兑换比例说明 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-orange-500" />
                  兑换比例
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">
                    🐄
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">1 POPCOW</p>
                    <p className="text-xs text-muted-foreground">质押代币</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-orange-500 rotate-90" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-2xl">
                    💎
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">2 POPCOW DEFI</p>
                    <p className="text-xs text-muted-foreground">奖励代币</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  基础兑换比例 1:2，锁定期越长收益倍数越高
                </p>
              </CardContent>
            </Card>

            {/* 购买 POPCOW */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">获取 POPCOW</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  前往以下平台购买 POPCOW 代币参与质押
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
                  <Link href="https://raydium.io/swap" target="_blank" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      Raydium
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部说明 */}
        <Card className="bg-secondary/30">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">安全可靠</p>
                  <p className="text-sm text-muted-foreground">
                    智能合约经过审计，资金安全有保障
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">灵活选择</p>
                  <p className="text-sm text-muted-foreground">
                    5种锁定期可选，满足不同投资需求
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">高额收益</p>
                  <p className="text-sm text-muted-foreground">
                    最高 50% APY，1:2 兑换比例
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
