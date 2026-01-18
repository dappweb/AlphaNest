'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Award,
  ArrowRight,
  Loader2,
  Zap,
} from 'lucide-react';
import { useReferral, TIER_CONFIG, type ReferralTier } from '@/hooks/use-referral';
import { cn } from '@/lib/utils';

interface ReferralStatsProps {
  className?: string;
}

export function ReferralStats({ className }: ReferralStatsProps) {
  const { 
    stats, 
    isLoadingStats,
    tierConfig,
    nextTierConfig,
    progressToNextTier,
    claimRewards,
    isClaiming,
    claimSuccess,
    config,
  } = useReferral();

  if (isLoadingStats) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 等级卡片 */}
      <Card className="overflow-hidden">
        <div className={cn(
          'absolute inset-0 opacity-10',
          stats.currentTier === 'diamond' && 'bg-gradient-to-br from-purple-500 to-pink-500',
          stats.currentTier === 'platinum' && 'bg-gradient-to-br from-blue-400 to-cyan-400',
          stats.currentTier === 'gold' && 'bg-gradient-to-br from-yellow-400 to-orange-400',
          stats.currentTier === 'silver' && 'bg-gradient-to-br from-gray-300 to-gray-400',
          stats.currentTier === 'bronze' && 'bg-gradient-to-br from-orange-300 to-orange-500',
        )} />
        
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'text-3xl',
                tierConfig.color
              )}>
                {tierConfig.icon}
              </div>
              <div>
                <h3 className={cn('text-lg font-bold', tierConfig.color)}>
                  {tierConfig.name} Tier
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.currentRate}% commission rate
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn('text-xs', tierConfig.color, `border-current`)}
            >
              <Zap className="h-3 w-3 mr-1" />
              {stats.totalReferred} referrals
            </Badge>
          </div>

          {/* 进度到下一等级 */}
          {nextTierConfig && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress to {nextTierConfig.name}</span>
                <span className={nextTierConfig.color}>
                  {stats.referralsToNextTier} more needed
                </span>
              </div>
              <Progress value={progressToNextTier} className="h-2" />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{tierConfig.icon} {tierConfig.name}</span>
                <span>{nextTierConfig.icon} {nextTierConfig.name} ({nextTierConfig.rate}%)</span>
              </div>
            </div>
          )}

          {!nextTierConfig && (
            <div className="text-center py-2">
              <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                👑 Maximum Tier Achieved!
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">Total Referred</span>
            </div>
            <p className="text-lg md:text-2xl font-bold">{stats.totalReferred}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">Active Stakers</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-green-500">{stats.activeStakers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">Total Earned</span>
            </div>
            <p className="text-lg md:text-2xl font-bold">
              {stats.totalEarnedPopCowDefi 
                ? `${stats.totalEarnedPopCowDefi.toLocaleString(undefined, { maximumFractionDigits: 2 })} POPCOW_DEFI`
                : `$${stats.totalEarned.toFixed(2)}`
              }
            </p>
            {stats.totalEarnedPopCowDefi && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                ≈ ${stats.totalEarned.toFixed(2)} USD
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-orange-500">
              {stats.pendingRewardsPopCowDefi 
                ? `${stats.pendingRewardsPopCowDefi.toLocaleString(undefined, { maximumFractionDigits: 2 })} POPCOW_DEFI`
                : `$${stats.pendingRewards.toFixed(2)}`
              }
            </p>
            {stats.pendingRewardsPopCowDefi && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                ≈ ${stats.pendingRewards.toFixed(2)} USD
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 领取奖励 */}
      {stats.pendingRewards > 0 && (
        <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Pending Rewards
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  You have{' '}
                  <span className="text-yellow-500 font-bold">
                    {stats.pendingRewardsPopCowDefi 
                      ? `${stats.pendingRewardsPopCowDefi.toLocaleString(undefined, { maximumFractionDigits: 2 })} POPCOW_DEFI`
                      : `$${stats.pendingRewards.toFixed(2)}`
                    }
                  </span>
                  {' '}to claim
                  {stats.pendingRewardsPopCowDefi && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (≈ ${stats.pendingRewards.toFixed(2)} USD)
                    </span>
                  )}
                </p>
                {stats.pendingRewards < config.minClaimAmount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum claim amount: ${config.minClaimAmount}
                  </p>
                )}
              </div>
              <Button
                onClick={claimRewards}
                disabled={isClaiming || stats.pendingRewards < config.minClaimAmount}
                className="bg-yellow-500 hover:bg-yellow-600 text-black w-full sm:w-auto"
              >
                {isClaiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : claimSuccess ? (
                  <>Claimed!</>
                ) : (
                  <>
                    Claim Now
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 等级列表组件
 */
export function TierList({ className }: { className?: string }) {
  const { stats } = useReferral();

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-yellow-500" />
          Referral Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          {(Object.entries(TIER_CONFIG) as [ReferralTier, typeof TIER_CONFIG[ReferralTier]][]).map(([tier, config]) => {
            const isCurrentTier = stats?.currentTier === tier;
            const isAchieved = stats ? stats.totalReferred >= config.minReferrals : false;

            return (
              <div
                key={tier}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg transition-colors',
                  isCurrentTier && 'bg-yellow-500/10 border border-yellow-500/30',
                  isAchieved && !isCurrentTier && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <p className={cn('text-sm font-medium', config.color)}>
                      {config.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {config.minReferrals}+ referrals
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={isCurrentTier ? 'default' : 'outline'}
                  className={cn(
                    'text-xs',
                    isCurrentTier && 'bg-yellow-500 text-black'
                  )}
                >
                  {config.rate}%
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
