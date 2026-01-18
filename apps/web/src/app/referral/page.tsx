'use client';

import { Gift, TrendingUp, Users, Award, Shield, Zap, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReferralCodeCard, ReferralStats, TierList, ReferralRecords } from '@/components/referral';
import { useActiveChain } from '@/components/ui/chain-switcher';
import { useReferral, REFERRAL_CONFIG } from '@/hooks/use-referral';

export default function ReferralPage() {
  const { isSolana } = useActiveChain();
  const { isConnected } = useReferral();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="h-6 w-6 md:h-7 md:w-7 text-purple-500" />
          Invite & Earn
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Share PopCowDefi with friends and earn up to 15% commission
        </p>
      </div>

      {/* 徽章 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 text-[10px] md:text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Solana (pump.fun)
        </Badge>
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px] md:text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Instant Rewards
        </Badge>
        <Badge variant="outline" className="text-[10px] md:text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          Up to 15% Commission
        </Badge>
      </div>

      {/* 未连接钱包提示 */}
      {!isConnected && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <Info className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm">
            Connect your wallet to get your unique referral code and start earning!
          </AlertDescription>
        </Alert>
      )}

      {/* 主要内容 */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* 左侧 - 推荐码和统计 */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* 推荐码卡片 */}
          <ReferralCodeCard />

          {/* 统计信息 */}
          <ReferralStats />

          {/* 推荐记录 */}
          <ReferralRecords />
        </div>

        {/* 右侧 - 等级和说明 */}
        <div className="space-y-4">
          {/* 等级列表 */}
          <TierList />

          {/* 奖励规则 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </div>
                <p>Share your unique referral code or link with friends</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </div>
                <p>Your friend signs up and stakes or buys insurance</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </div>
                <p>You earn commission on their activities (5-15%)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                  ✓
                </div>
                <p>Your friend gets {REFERRAL_CONFIG.inviteeBonus}% bonus on first stake!</p>
              </div>
            </CardContent>
          </Card>

          {/* 双向奖励说明 */}
          <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Double Rewards</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                  <span className="text-muted-foreground">You Earn</span>
                  <span className="font-bold text-yellow-500">5-15%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                  <span className="text-muted-foreground">Friend Gets</span>
                  <span className="font-bold text-green-500">+{REFERRAL_CONFIG.inviteeBonus}%</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Commission calculated on staking deposits and insurance premiums
              </p>
            </CardContent>
          </Card>

          {/* Solana 支持 */}
          <Card className="bg-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Solana Support</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
                  <span className="text-base">🟣</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">Solana - pump.fun</p>
                    <p className="text-[10px] text-muted-foreground">SOL, SPL tokens</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Referral code works on Solana network
              </p>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                FAQ
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-3">
              <div>
                <p className="text-xs font-medium">When do I get paid?</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Rewards accumulate in real-time. Claim when you reach ${REFERRAL_CONFIG.minClaimAmount} minimum.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium">How long do I earn?</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Forever! You earn commission as long as your referrals are active.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium">Can I refer myself?</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  No, self-referrals are not allowed and will be flagged.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
