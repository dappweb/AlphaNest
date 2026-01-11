'use client';

import { Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/use-referral';

export function ReferralStats() {
  const { stats, currentTier, nextTier, isConnected, isLoading } = useReferral();

  if (!isConnected) {
    return null;
  }

  const progress = nextTier
    ? ((stats?.totalReferrals || 0) - currentTier.minReferrals) /
      (nextTier.minReferrals - currentTier.minReferrals) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Tier Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Tier</span>
            <Badge className={getTierColor(currentTier.name)}>
              {currentTier.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reward Rate</span>
            <span className="font-bold text-primary">{(currentTier.rewardRate * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bonus Multiplier</span>
            <span className="font-bold">{currentTier.bonusMultiplier}x</span>
          </div>
          
          {nextTier && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                <span>{stats?.totalReferrals || 0} / {nextTier.minReferrals}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextTier.minReferrals - (stats?.totalReferrals || 0)} more referrals to unlock{' '}
                <span className="text-primary">{(nextTier.rewardRate * 100).toFixed(0)}% rewards</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeReferrals || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(stats?.totalEarnings || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(stats?.pendingEarnings || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    Starter: 'bg-gray-500',
    Bronze: 'bg-amber-700',
    Silver: 'bg-gray-400 text-gray-900',
    Gold: 'bg-yellow-500 text-yellow-900',
    Platinum: 'bg-cyan-400 text-cyan-900',
    Diamond: 'bg-purple-500',
  };
  return colors[tier] || 'bg-gray-500';
}
