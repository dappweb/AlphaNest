'use client';

import { Trophy, Zap, TrendingUp, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TIER_CONFIG = {
  bronze: { color: 'bg-amber-700', next: 'silver', minPoints: 0, maxPoints: 1000 },
  silver: { color: 'bg-gray-400', next: 'gold', minPoints: 1000, maxPoints: 5000 },
  gold: { color: 'bg-yellow-500', next: 'platinum', minPoints: 5000, maxPoints: 20000 },
  platinum: { color: 'bg-cyan-400', next: 'diamond', minPoints: 20000, maxPoints: 100000 },
  diamond: { color: 'bg-purple-500', next: null, minPoints: 100000, maxPoints: Infinity },
};

export function PointsOverview() {
  // Mock data - replace with actual API call
  const userData = {
    points: 3250,
    tier: 'silver' as keyof typeof TIER_CONFIG,
    rank: 156,
    multiplier: 1.5,
    streakDays: 7,
    pendingRewards: 500,
  };

  const tierConfig = TIER_CONFIG[userData.tier];
  const progress = ((userData.points - tierConfig.minPoints) / (tierConfig.maxPoints - tierConfig.minPoints)) * 100;

  return (
    <div className="space-y-6">
      {/* Main Points Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <h1 className="text-4xl font-bold">{userData.points.toLocaleString()}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={`${tierConfig.color} text-white`}>
                  {userData.tier.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Rank #{userData.rank}
                </span>
              </div>
            </div>
            <div className="text-right">
              <Trophy className="h-16 w-16 text-primary opacity-50" />
            </div>
          </div>
          
          {/* Progress to next tier */}
          {tierConfig.next && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to {tierConfig.next.toUpperCase()}
                </span>
                <span className="font-medium">
                  {userData.points.toLocaleString()} / {tierConfig.maxPoints.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Multiplier</p>
                <p className="text-xl font-bold">{userData.multiplier}x</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-xl font-bold">{userData.streakDays} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Gift className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">+{userData.pendingRewards}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Trophy className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Global Rank</p>
                <p className="text-xl font-bold">#{userData.rank}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
