'use client';

import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  tier: string;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: '0x1234...abcd', points: 125000, tier: 'diamond' },
  { rank: 2, address: '0x5678...efgh', points: 98500, tier: 'diamond' },
  { rank: 3, address: '0x9abc...ijkl', points: 87200, tier: 'platinum' },
  { rank: 4, address: '0xdef0...mnop', points: 65400, tier: 'platinum' },
  { rank: 5, address: '0x1357...qrst', points: 54300, tier: 'platinum' },
  { rank: 6, address: '0x2468...uvwx', points: 43200, tier: 'gold' },
  { rank: 7, address: '0x3579...yzab', points: 38100, tier: 'gold' },
  { rank: 8, address: '0x4680...cdef', points: 32500, tier: 'gold' },
  { rank: 9, address: '0x5791...ghij', points: 28900, tier: 'gold' },
  { rank: 10, address: '0x6802...klmn', points: 25600, tier: 'gold' },
];

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-cyan-400',
  diamond: 'bg-purple-500',
};

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
}

export function PointsLeaderboard() {
  // Mock current user rank
  const currentUserRank = {
    rank: 156,
    address: '0xYOUR...ADDR',
    points: 3250,
    tier: 'silver',
    isCurrentUser: true,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Top 10 */}
        <div className="space-y-2">
          {MOCK_LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                entry.rank <= 3 ? 'bg-secondary/50' : 'hover:bg-secondary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <p className="font-mono text-sm">{entry.address}</p>
                  <Badge 
                    className={`${TIER_COLORS[entry.tier]} text-white text-[10px] px-1.5 py-0`}
                  >
                    {entry.tier}
                  </Badge>
                </div>
              </div>
              <span className="font-mono font-bold">
                {entry.points.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>Your Position</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Current User */}
        <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center">
                <span className="text-sm font-bold">#{currentUserRank.rank}</span>
              </div>
              <div>
                <p className="font-mono text-sm">{currentUserRank.address}</p>
                <Badge 
                  className={`${TIER_COLORS[currentUserRank.tier]} text-white text-[10px] px-1.5 py-0`}
                >
                  {currentUserRank.tier}
                </Badge>
              </div>
            </div>
            <span className="font-mono font-bold text-primary">
              {currentUserRank.points.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg bg-secondary/50 p-2">
            <p className="text-muted-foreground">Total Players</p>
            <p className="font-bold">12,458</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2">
            <p className="text-muted-foreground">Points Distributed</p>
            <p className="font-bold">8.5M</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
