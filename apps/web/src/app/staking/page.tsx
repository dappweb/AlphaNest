'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Coins, 
  ArrowRight, 
  ExternalLink,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import {
  useAlphaNestStaking,
  useStake,
  useRequestUnstake,
  useCompleteUnstake,
  useClaimRewards,
} from '@/hooks/use-alphanest-core';

export default function StakingPage() {
  const { isConnected, address } = useAccount();
  const { t } = useTranslation();
  
  // 使用 EVM 质押 hooks
  const {
    stakeInfo,
    pointsInfo,
    globalStats,
    isLoading,
    refetch,
  } = useAlphaNestStaking();

  const { stake, isPending: isStaking, isSuccess: stakeSuccess } = useStake();
  const { requestUnstake, isPending: isUnstaking, isSuccess: unstakeSuccess } = useRequestUnstake();
  const { completeUnstake, isPending: isCompleting, isSuccess: completeSuccess } = useCompleteUnstake();
  const { claimRewards, isPending: isClaiming, isSuccess: claimSuccess } = useClaimRewards();

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stake');

  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return;
    try {
      await stake(stakeAmount);
      setStakeAmount('');
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Stake failed:', error);
    }
  };

  const handleRequestUnstake = async () => {
    if (!unstakeAmount || Number(unstakeAmount) <= 0) return;
    try {
      await requestUnstake(unstakeAmount);
      setUnstakeAmount('');
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Unstake request failed:', error);
    }
  };

  const handleCompleteUnstake = async () => {
    try {
      await completeUnstake();
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Complete unstake failed:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await claimRewards();
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
            {t.staking.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <Shield className="h-3 w-3 mr-1" />
            {t.staking.contractAudited}
          </Badge>
        </div>
      </div>

      {/* 全局统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {globalStats.totalStakedFormatted} ALPHA
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Min Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {globalStats.minStakeFormatted} ALPHA
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cooldown Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {globalStats.unstakeCooldownDays} Days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fee Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              30% to Stakers
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
                Stake ALPHA Tokens
              </CardTitle>
              <CardDescription>
                Stake your ALPHA tokens to earn protocol fee rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 用户质押信息 */}
              {isConnected && stakeInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Your Staked</p>
                    <p className="text-lg font-bold">{stakeInfo.stakedAmountFormatted} ALPHA</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pending Rewards</p>
                    <p className="text-lg font-bold text-green-500">{stakeInfo.pendingRewardsFormatted} ALPHA</p>
                  </div>
                </div>
              )}

              {/* Pending Unstake Info */}
              {isConnected && stakeInfo && Number(stakeInfo.pendingUnstakeFormatted) > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      Pending unstake: {stakeInfo.pendingUnstakeFormatted} ALPHA
                      {stakeInfo.canCompleteUnstake ? ' (Ready to withdraw)' : ' (In cooldown)'}
                    </span>
                    {stakeInfo.canCompleteUnstake && (
                      <Button
                        size="sm"
                        onClick={handleCompleteUnstake}
                        disabled={isCompleting}
                      >
                        {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Withdraw'}
                      </Button>
                    )}
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Stake</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter amount"
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
                    {stakeSuccess && (
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Stake successful!
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum stake: {globalStats.minStakeFormatted} ALPHA
                  </p>
                </TabsContent>

                <TabsContent value="unstake" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Unstake</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleRequestUnstake}
                        disabled={!isConnected || isUnstaking || !unstakeAmount || Number(unstakeAmount) <= 0}
                        variant="outline"
                      >
                        {isUnstaking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Request Unstake
                      </Button>
                    </div>
                    {unstakeSuccess && (
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Unstake request submitted!
                      </p>
                    )}
                  </div>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unstaking requires a {globalStats.unstakeCooldownDays}-day cooldown period before you can withdraw.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              {/* 领取奖励 */}
              {isConnected && stakeInfo && Number(stakeInfo.pendingRewardsFormatted) > 0 && (
                <div className="rounded-lg border bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Rewards</p>
                      <p className="text-2xl font-bold text-green-500">
                        {stakeInfo.pendingRewardsFormatted} ALPHA
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
                      Claim Rewards
                    </Button>
                  </div>
                  {claimSuccess && (
                    <p className="text-sm text-green-500 flex items-center gap-1 mt-2">
                      <CheckCircle className="h-4 w-4" />
                      Rewards claimed successfully!
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
                  <span>30% of protocol fees distributed to stakers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>Mining weight increases over time (up to 2x)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-purple-500 mt-0.5" />
                  <span>{globalStats.unstakeCooldownDays}-day cooldown for unstaking</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 积分信息 */}
          {isConnected && pointsInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="font-bold">{pointsInfo.balanceFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="text-green-500">{pointsInfo.totalEarned.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="text-red-500">{pointsInfo.totalSpent.toString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 合约链接 */}
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium">Contract Verified</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                AlphaNestCore contract deployed on Sepolia testnet
              </p>
              <Link
                href="https://sepolia.etherscan.io/address/0x0DE761C3A2e72BFa04B660395856ADc0A1252879"
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
