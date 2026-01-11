'use client';

import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReferralLeaderboard } from '@/hooks/use-referral';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-yellow-500 text-yellow-900';
    case 2:
      return 'bg-gray-400 text-gray-900';
    case 3:
      return 'bg-amber-700 text-white';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    Starter: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    Bronze: 'bg-amber-700/10 text-amber-600 border-amber-700/30',
    Silver: 'bg-gray-400/10 text-gray-300 border-gray-400/30',
    Gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Platinum: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30',
    Diamond: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };
  return colors[tier] || 'bg-gray-500/10 text-gray-400';
}

export function ReferralLeaderboard() {
  const { leaderboard, isLoading } = useReferralLeaderboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Referrers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.address}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${getRankStyle(
                    index + 1
                  )}`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-mono text-sm font-medium">
                    {shortenAddress(entry.address)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.referrals} referrals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-success">
                    ${entry.earnings.toFixed(0)}
                  </p>
                </div>
                <Badge variant="outline" className={getTierColor(entry.tier)}>
                  {entry.tier}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
