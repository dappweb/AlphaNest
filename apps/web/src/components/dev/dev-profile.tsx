'use client';

import { CheckCircle, Copy, ExternalLink, Bell, BellOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatAddress } from '@/lib/utils';

interface DevProfileProps {
  address: string;
}

const mockDev = {
  alias: 'AlphaWhale',
  verified: true,
  tier: 'diamond',
  score: 92,
  joinedAt: '2024-01-15',
  followers: 1234,
  isFollowing: false,
};

function getTierColor(tier: string) {
  switch (tier) {
    case 'diamond':
      return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
    case 'platinum':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'gold':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'silver':
      return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    default:
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

export function DevProfile({ address }: DevProfileProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {mockDev.alias?.charAt(0) || address.charAt(2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {mockDev.alias || formatAddress(address)}
                </h1>
                {mockDev.verified && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatAddress(address)}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTierColor(mockDev.tier)}>
                  {mockDev.tier.charAt(0).toUpperCase() + mockDev.tier.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Joined {mockDev.joinedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Reputation Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(mockDev.score)}`}>
                {mockDev.score}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                {mockDev.isFollowing ? (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Follow Dev
                  </>
                )}
              </Button>
              <Button>Copy Trade</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {mockDev.followers.toLocaleString()} followers
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
