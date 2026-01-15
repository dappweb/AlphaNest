'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Coins,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAKING_POOLS, STAKEABLE_TOKENS, estimateRewards } from '@/lib/solana';
import { TokenSelector } from './token-selector';

interface StakingCardProps {
  tokenBalances?: Record<string, number>;
  popCowDefiBalance: number;
  stakedAmounts?: Record<string, number>;
  pendingRewards: number;
  onStake: (amount: number, poolId: number, tokenSymbol: string) => Promise<void>;
  onUnstake: (amount: number, poolId: number, tokenSymbol: string) => Promise<void>;
  onClaim: (poolId: number) => Promise<void>;
  isLoading?: boolean;
  isConnected?: boolean;
}

export function StakingCard({
  tokenBalances = {},
  popCowDefiBalance = 0,
  stakedAmounts = {},
  pendingRewards = 0,
  onStake,
  onUnstake,
  onClaim,
  isLoading = false,
  isConnected = false,
}: StakingCardProps) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState(STAKING_POOLS.flexible.id);
  const [selectedToken, setSelectedToken] = useState<typeof STAKEABLE_TOKENS[0] | null>(STAKEABLE_TOKENS[0]);
  const [activeTab, setActiveTab] = useState('stake');

  const pools = Object.values(STAKING_POOLS);
  const currentPool = pools.find(p => p.id === selectedPool) || pools[0];
  
  const currentBalance = selectedToken ? (tokenBalances[selectedToken.symbol] || 0) : 0;
  const currentStaked = selectedToken ? (stakedAmounts[selectedToken.symbol] || 0) : 0;
  const rewardMultiplier = selectedToken?.rewardMultiplier || 1;
  
  const estimatedRewards = estimateRewards(
    (Number(stakeAmount) || 0) * rewardMultiplier,
    selectedPool,
    currentPool.lockPeriod > 0 ? currentPool.lockPeriod / 86400 : 30
  );

  const handleStake = async () => {
    if (!selectedToken) return;
    const amount = Number(stakeAmount);
    if (amount <= 0 || amount > currentBalance) return;
    await onStake(amount, selectedPool, selectedToken.symbol);
    setStakeAmount('');
  };

  const handleUnstake = async () => {
    if (!selectedToken) return;
    const amount = Number(unstakeAmount);
    if (amount <= 0 || amount > currentStaked) return;
    await onUnstake(amount, selectedPool, selectedToken.symbol);
    setUnstakeAmount('');
  };

  const handleClaim = async () => {
    if (pendingRewards <= 0) return;
    await onClaim(selectedPool);
  };

  const setMaxStake = () => setStakeAmount(currentBalance.toString());
  const setMaxUnstake = () => setUnstakeAmount(currentStaked.toString());

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            质押挖矿
          </CardTitle>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            早鸟 2x 加成
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 代币选择 */}
        <div className="space-y-2">
          <p className="text-sm font-medium">选择质押代币</p>
          <TokenSelector
            selectedToken={selectedToken}
            onSelectToken={setSelectedToken}
            balances={tokenBalances}
          />
          {selectedToken && selectedToken.rewardMultiplier > 1 && (
            <p className="text-xs text-orange-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {selectedToken.symbol} 享受 {selectedToken.rewardMultiplier}x 奖励加成!
            </p>
          )}
        </div>

        {/* 余额概览 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">
              {selectedToken?.symbol || '代币'} 余额
            </p>
            <p className="text-lg font-bold">{currentBalance.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground mb-1">$PopCowDefi 余额</p>
            <p className="text-lg font-bold text-orange-500">{popCowDefiBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* 质押池选择 */}
        <div className="space-y-3">
          <p className="text-sm font-medium">选择质押池</p>
          <div className="grid grid-cols-3 gap-2">
            {pools.map((pool) => (
              <button
                key={pool.id}
                onClick={() => setSelectedPool(pool.id)}
                className={cn(
                  'flex flex-col items-center rounded-lg border p-3 transition-all',
                  selectedPool === pool.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-border hover:border-orange-500/50'
                )}
              >
                {pool.lockPeriod > 0 ? (
                  <Lock className="h-4 w-4 mb-1 text-orange-500" />
                ) : (
                  <Unlock className="h-4 w-4 mb-1 text-green-500" />
                )}
                <span className="text-xs font-medium">{pool.name}</span>
                <span className="text-lg font-bold text-orange-500">{pool.apy}%</span>
                <span className="text-[10px] text-muted-foreground">APY</span>
              </button>
            ))}
          </div>
        </div>

        {/* 质押/解押操作 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stake">质押</TabsTrigger>
            <TabsTrigger value="unstake">解押</TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">质押数量</label>
                <button
                  onClick={setMaxStake}
                  className="text-xs text-orange-500 hover:underline"
                >
                  最大: {currentBalance.toLocaleString()}
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
                  disabled={!isConnected || isLoading || !stakeAmount || Number(stakeAmount) <= 0}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading ? '处理中...' : '质押'}
                </Button>
              </div>
            </div>

            {/* 预估收益 */}
            {Number(stakeAmount) > 0 && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">预估收益</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">每日收益</p>
                    <p className="font-bold">{estimatedRewards.daily.toFixed(2)} $PopCowDefi</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {currentPool.lockPeriod > 0 
                        ? `${currentPool.lockPeriod / 86400}天总收益`
                        : '30天总收益'}
                    </p>
                    <p className="font-bold">{estimatedRewards.total.toFixed(2)} $PopCowDefi</p>
                  </div>
                </div>
              </div>
            )}

            {currentPool.lockPeriod > 0 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  锁仓期内提前解押将扣除 {currentPool.earlyWithdrawPenalty * 100}% 本金作为惩罚
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unstake" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">解押数量</label>
                <button
                  onClick={setMaxUnstake}
                  className="text-xs text-orange-500 hover:underline"
                >
                  已质押: {currentStaked.toLocaleString()}
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="输入解押数量"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleUnstake}
                  disabled={!isConnected || isLoading || !unstakeAmount || Number(unstakeAmount) <= 0}
                  variant="outline"
                >
                  {isLoading ? '处理中...' : '解押'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 待领取奖励 */}
        <div className="rounded-lg border bg-gradient-to-r from-orange-500/10 to-yellow-500/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">待领取奖励</p>
              <p className="text-2xl font-bold text-orange-500">
                {pendingRewards.toLocaleString()} <span className="text-sm">$PopCowDefi</span>
              </p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={!isConnected || isLoading || pendingRewards <= 0}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              领取奖励
            </Button>
          </div>
        </div>

        {/* 未连接钱包提示 */}
        {!isConnected && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">请先连接 Solana 钱包</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
