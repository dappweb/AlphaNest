'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Coins, 
  ExternalLink,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import {
  useMultiAssetStaking,
  useStakeETH,
  useUnstake,
  useClaimRewards,
  LockPeriod,
  LOCK_PERIOD_LABELS,
  ETH_ADDRESS,
} from '@/hooks/use-multi-asset-staking';

export default function StakingPage() {
  const { isConnected } = useAccount();
  const { t } = useTranslation();
  
  // 使用多资产质押 hooks
  const {
    stakeInfo,
    tokenConfig,
    globalStats,
    earlyBirdBonus,
    isLoading,
    refetch,
  } = useMultiAssetStaking(ETH_ADDRESS);

  const { stakeETH, isPending: isStaking, isSuccess: stakeSuccess } = useStakeETH();
  const { unstake, isPending: isUnstaking, isSuccess: unstakeSuccess } = useUnstake();
  const { claimRewards, isPending: isClaiming, isSuccess: claimSuccess } = useClaimRewards();

  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState<LockPeriod>(LockPeriod.Flexible);
  const [activeTab, setActiveTab] = useState('stake');

  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return;
    try {
      await stakeETH(stakeAmount, lockPeriod);
      setStakeAmount('');
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Stake failed:', error);
    }
  };

  const handleUnstake = async () => {
    try {
      await unstake(ETH_ADDRESS);
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Unstake failed:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await claimRewards(ETH_ADDRESS);
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-orange-500" />
            {t.staking.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Multi-Asset Staking - Stake ETH and earn rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          {earlyBirdBonus > 0 && (
            <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Early Bird +{earlyBirdBonus}%
            </Badge>
          )}
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Audited
          </Badge>
        </div>
      </div>

      {/* 全局统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staked (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${globalStats?.totalStakedUSDFormatted || '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stakers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {globalStats?.totalStakers?.toString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Supported Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {globalStats?.supportedTokenCount?.toString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Base APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {tokenConfig?.baseAPY || 10}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 质押卡片 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-orange-500" />
                Stake ETH
              </CardTitle>
              <CardDescription>
                Stake ETH with flexible lock periods for higher rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 用户质押信息 */}
              {isConnected && stakeInfo && Number(stakeInfo.stakedAmountFormatted) > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Staked</p>
                    <p className="text-lg font-bold">{stakeInfo.stakedAmountFormatted} ETH</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Value (USD)</p>
                    <p className="text-lg font-bold">${stakeInfo.valueUSDFormatted}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Multiplier</p>
                    <p className="text-lg font-bold text-orange-500">{Number(stakeInfo.rewardMultiplier) / 100}x</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pending Rewards</p>
                    <p className="text-lg font-bold text-green-500">{stakeInfo.pendingRewardsFormatted}</p>
                  </div>
                </div>
              )}

              {/* 锁定状态提示 */}
              {isConnected && stakeInfo && stakeInfo.isLocked && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Your stake is locked until {new Date(Number(stakeInfo.unlockTime) * 1000).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}

              {/* 质押/解押操作 */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stake">Stake</TabsTrigger>
                  <TabsTrigger value="unstake">Unstake</TabsTrigger>
                </TabsList>

                <TabsContent value="stake" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lock Period</label>
                      <Select
                        value={lockPeriod.toString()}
                        onValueChange={(v) => setLockPeriod(Number(v) as LockPeriod)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LOCK_PERIOD_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (ETH)</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleStake}
                          disabled={!isConnected || isStaking || !stakeAmount || Number(stakeAmount) <= 0}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {isStaking ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Stake
                        </Button>
                      </div>
                    </div>

                    {stakeSuccess && (
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Stake successful!
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="unstake" className="space-y-4 mt-4">
                  {stakeInfo && Number(stakeInfo.stakedAmountFormatted) > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-secondary/50 p-4">
                        <p className="text-sm text-muted-foreground mb-2">Available to Unstake</p>
                        <p className="text-2xl font-bold">{stakeInfo.stakedAmountFormatted} ETH</p>
                      </div>

                      <Button
                        onClick={handleUnstake}
                        disabled={!isConnected || isUnstaking || stakeInfo.isLocked}
                        variant="outline"
                        className="w-full"
                      >
                        {isUnstaking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {stakeInfo.isLocked ? 'Locked' : 'Unstake All'}
                      </Button>

                      {unstakeSuccess && (
                        <p className="text-sm text-green-500 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Unstake successful!
                        </p>
                      )}

                      {stakeInfo.isLocked && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your stake is locked. You can unstake after {new Date(Number(stakeInfo.unlockTime) * 1000).toLocaleDateString()}.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No stake to unstake
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* 领取奖励 */}
              {isConnected && stakeInfo && Number(stakeInfo.pendingRewardsFormatted) > 0 && (
                <div className="rounded-lg border bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Rewards</p>
                      <p className="text-2xl font-bold text-green-500">
                        {stakeInfo.pendingRewardsFormatted} Tokens
                      </p>
                    </div>
                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {isClaiming ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-2" />
                      )}
                      Claim
                    </Button>
                  </div>
                  {claimSuccess && (
                    <p className="text-sm text-green-500 flex items-center gap-1 mt-2">
                      <CheckCircle className="h-4 w-4" />
                      Rewards claimed!
                    </p>
                  )}
                </div>
              )}

              {/* 未连接钱包提示 */}
              {!isConnected && (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground mb-2">Connect your wallet to start staking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 侧边信息 */}
        <div className="space-y-4">
          {/* 锁定期说明 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                Lock Period Multipliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Flexible</span>
                  <span className="font-bold">1x</span>
                </li>
                <li className="flex justify-between">
                  <span>30 Days</span>
                  <span className="font-bold text-orange-500">1.5x</span>
                </li>
                <li className="flex justify-between">
                  <span>90 Days</span>
                  <span className="font-bold text-orange-500">2x</span>
                </li>
                <li className="flex justify-between">
                  <span>180 Days</span>
                  <span className="font-bold text-orange-500">3x</span>
                </li>
                <li className="flex justify-between">
                  <span>365 Days</span>
                  <span className="font-bold text-green-500">5x</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 早鸟奖励 */}
          {earlyBirdBonus > 0 && (
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Early Bird Bonus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-500 mb-2">+{earlyBirdBonus}%</p>
                <p className="text-sm text-muted-foreground">
                  Extra rewards for early stakers! This bonus decreases over time.
                </p>
              </CardContent>
            </Card>
          )}

          {/* 质押说明 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Staking Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Coins className="h-4 w-4 text-orange-500 mt-0.5" />
                  <span>Multi-asset staking (ETH, USDC, USDT)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Higher rewards for longer lock periods</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-pink-500 mt-0.5" />
                  <span>Early bird bonus for first 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-purple-500 mt-0.5" />
                  <span>Flexible unstaking available</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 合约链接 */}
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium">Contract Verified</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                MultiAssetStaking contract
              </p>
              <Link
                href="https://sepolia.etherscan.io/address/0x0000000000000000000000000000000000000000"
                target="_blank"
              >
                <Button size="sm" variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Etherscan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
