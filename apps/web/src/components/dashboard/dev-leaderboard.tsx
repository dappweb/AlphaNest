'use client';

import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatAddress, formatPercent } from '@/lib/utils';

const topDevs = [
  {
    id: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    alias: 'AlphaWhale',
    winRate: 78.5,
    totalLaunches: 45,
    rugCount: 0,
    verified: true,
    rank: 1,
  },
  {
    id: 2,
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    alias: 'MemeKing',
    winRate: 72.3,
    totalLaunches: 62,
    rugCount: 1,
    verified: true,
    rank: 2,
  },
  {
    id: 3,
    address: '0x567890abcdef1234567890abcdef1234567890ab',
    alias: 'DeFiDegen',
    winRate: 68.9,
    totalLaunches: 38,
    rugCount: 0,
    verified: true,
    rank: 3,
  },
  {
    id: 4,
    address: '0x890abcdef1234567890abcdef1234567890abcd',
    alias: null,
    winRate: 65.2,
    totalLaunches: 28,
    rugCount: 2,
    verified: false,
    rank: 4,
  },
  {
    id: 5,
    address: '0xcdef1234567890abcdef1234567890abcdef1234',
    alias: 'TokenMaster',
    winRate: 61.8,
    totalLaunches: 55,
    rugCount: 1,
    verified: true,
    rank: 5,
  },
];

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 2:
      return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    case 3:
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    default:
      return '';
  }
}

export function DevLeaderboard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Devs</CardTitle>
        <Button variant="ghost" size="sm">
          View All
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topDevs.map((dev) => (
            <div
              key={dev.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${getRankBadge(
                    dev.rank
                  )}`}
                >
                  #{dev.rank}
                </div>
                <Avatar>
                  <AvatarFallback>
                    {(dev.alias || dev.address).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {dev.alias || formatAddress(dev.address)}
                    </span>
                    {dev.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(dev.address)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p
                    className={`font-medium ${
                      dev.winRate >= 70
                        ? 'text-success'
                        : dev.winRate >= 50
                        ? 'text-warning'
                        : 'text-destructive'
                    }`}
                  >
                    {dev.winRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Launches</p>
                  <p className="font-medium">{dev.totalLaunches}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Rugs</p>
                  <p
                    className={`flex items-center font-medium ${
                      dev.rugCount > 0 ? 'text-destructive' : 'text-success'
                    }`}
                  >
                    {dev.rugCount > 0 && (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    {dev.rugCount}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
