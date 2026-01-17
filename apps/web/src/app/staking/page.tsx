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
  ArrowRight,
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
    <div className="space-y-4 md:space-y-6">
      {/* 页面标题 - 响应式 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Coins className="h-6 w-6 md:h-7 md:w-7 text-orange-500" />
              {t.staking.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Multi-Asset Staking - Stake and earn rewards
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {earlyBirdBonus > 0 && (
              <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 text-[10px] md:text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                +{earlyBirdBonus}% Bonus
              </Badge>
            )}
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px] md:text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Audited
            </Badge>
          </div>
        </div>
      </div>

      {/* 全局统计 - 响应式网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Total Staked</p>
            <p className="text-lg md:text-2xl font-bold mt-1">
              ${globalStats?.totalStakedUSDFormatted || '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Total Stakers</p>
            <p className="text-lg md:text-2xl font-bold mt-1">
              {globalStats?.totalStakers?.toString() || '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Supported Assets</p>
            <p className="text-lg md:text-2xl font-bold mt-1">
              {globalStats?.supportedTokenCount?.toString() || '4'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Base APY</p>
            <p className="text-lg md:text-2xl font-bold text-green-500 mt-1">
              {tokenConfig?.baseAPY || 10}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 - 响应式布局 */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* 质押卡片 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Coins className="h-5 w-5 text-orange-500" />
                Stake ETH
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Stake with flexible lock periods for higher rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* 用户质押信息 - 响应式网格 */}
              {isConnected && stakeInfo && Number(stakeInfo.stakedAmountFormatted) > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  <div className="rounded-lg bg-secondary/50 p-2.5 md:p-3">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Staked</p>
                    <p className="text-sm md:text-lg font-bold truncate">{stakeInfo.stakedAmountFormatted} ETH</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2.5 md:p-3">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Value</p>
                    <p className="text-sm md:text-lg font-bold truncate">${stakeInfo.valueUSDFormatted}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2.5 md:p-3">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Multiplier</p>
                    <p className="text-sm md:text-lg font-bold text-orange-500">{Number(stakeInfo.rewardMultiplier) / 100}x</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2.5 md:p-3">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Rewards</p>
                    <p className="text-sm md:text-lg font-bold text-green-500 truncate">{stakeInfo.pendingRewardsFormatted}</p>
                  </div>
                </div>
              )}

              {/* 锁定状态提示 */}
              {isConnected && stakeInfo && stakeInfo.isLocked && (
                <Alert className="py-2">
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    Locked until {new Date(Number(stakeInfo.unlockTime) * 1000).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}

              {/* 质押/解押 Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 h-10 md:h-11">
                  <TabsTrigger value="stake" className="text-sm">Stake</TabsTrigger>
                  <TabsTrigger value="unstake" className="text-sm">Unstake</TabsTrigger>
                </TabsList>

                <TabsContent value="stake" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                  <div className="space-y-3">
                    {/* 锁定期选择 */}
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-medium">Lock Period</label>
                      <Select
                        value={lockPeriod.toString()}
                        onValueChange={(v) => setLockPeriod(Number(v) as LockPeriod)}
                      >
                        <SelectTrigger className="h-10 md:h-11 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LOCK_PERIOD_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-sm">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 金额输入 */}
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-medium">Amount (ETH)</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          className="flex-1 h-10 md:h-11 text-sm"
                        />
                        <Button
                          onClick={handleStake}
                          disabled={!isConnected || isStaking || !stakeAmount || Number(stakeAmount) <= 0}
                          className="bg-orange-500 hover:bg-orange-600 h-10 md:h-11 px-4 md:px-6"
                        >
                          {isStaking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Stake
                              <ArrowRight className="h-4 w-4 ml-1 hidden sm:inline" />
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* 快捷金额 */}
                      <div className="flex gap-1.5 mt-2">
                        {['0.1', '0.5', '1', '5'].map((val) => (
                          <Button
                            key={val}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => setStakeAmount(val)}
                          >
                            {val} ETH
                          </Button>
                        ))}
                      </div>
                    </div>

                    {stakeSuccess && (
                      <p className="text-xs md:text-sm text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Stake successful!
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="unstake" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                  {stakeInfo && Number(stakeInfo.stakedAmountFormatted) > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      <div className="rounded-lg bg-secondary/50 p-3 md:p-4">
                        <p className="text-xs md:text-sm text-muted-foreground">Available to Unstake</p>
                        <p className="text-xl md:text-2xl font-bold mt-1">{stakeInfo.stakedAmountFormatted} ETH</p>
                      </div>

                      <Button
                        onClick={handleUnstake}
                        disabled={!isConnected || isUnstaking || stakeInfo.isLocked}
                        variant="outline"
                        className="w-full h-10 md:h-11"
                      >
                        {isUnstaking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {stakeInfo.isLocked ? 'Locked' : 'Unstake All'}
                      </Button>

                      {unstakeSuccess && (
                        <p className="text-xs md:text-sm text-green-500 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Unstake successful!
                        </p>
                      )}

                      {stakeInfo.isLocked && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs md:text-sm">
                            Unlocks on {new Date(Number(stakeInfo.unlockTime) * 1000).toLocaleDateString()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
                      No stake to unstake
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* 领取奖励 */}
              {isConnected && stakeInfo && Number(stakeInfo.pendingRewardsFormatted) > 0 && (
                <div className="rounded-lg border bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3 md:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Pending Rewards</p>
                      <p className="text-lg md:text-2xl font-bold text-green-500">
                        {stakeInfo.pendingRewardsFormatted}
                      </p>
                    </div>
                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="bg-green-500 hover:bg-green-600 h-9 md:h-10"
                    >
                      {isClaiming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-1.5" />
                          Claim
                        </>
                      )}
                    </Button>
                  </div>
                  {claimSuccess && (
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-2">
                      <CheckCircle className="h-3 w-3" />
                      Claimed!
                    </p>
                  )}
                </div>
              )}

              {/* 未连接钱包 */}
              {!isConnected && (
                <div className="text-center py-6 md:py-8 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Connect wallet to start staking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 侧边信息 - 移动端堆叠 */}
        <div className="space-y-3 md:space-y-4">
          {/* 锁定期倍数 */}
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                Lock Multipliers
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 md:pb-4">
              <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                {Object.entries(LOCK_PERIOD_LABELS).map(([_, label]) => {
                  const [period, multiplier] = label.split(' (');
                  return (
                    <div key={label} className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{period}</span>
                      <Badge variant="outline" className="text-[10px] md:text-xs font-bold">
                        {multiplier?.replace(')', '')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 早鸟奖励 */}
          {earlyBirdBonus > 0 && (
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Early Bird Bonus</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-orange-500">+{earlyBirdBonus}%</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  Extra rewards for early stakers
                </p>
              </CardContent>
            </Card>
          )}

          {/* 支持的资产 */}
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-orange-500" />
                Supported Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 md:pb-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px] md:text-xs">ETH</Badge>
                <Badge variant="secondary" className="text-[10px] md:text-xs">USDC</Badge>
                <Badge variant="secondary" className="text-[10px] md:text-xs">USDT</Badge>
                <Badge variant="secondary" className="text-[10px] md:text-xs">Custom</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 合约信息 */}
          <Card className="bg-secondary/30">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-500" />
                <p className="text-xs md:text-sm font-medium">Contract Verified</p>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-3">
                MultiAssetStaking
              </p>
              <Link href="https://etherscan.io" target="_blank">
                <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Etherscan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
