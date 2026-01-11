'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, Copy, CheckCircle, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatAddress } from '@/lib/utils';

export interface Trader {
  address: string;
  alias?: string;
  verified: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  score: number;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  trades: number;
  followers: number;
  aum: number;
  isFollowing?: boolean;
}

interface CopyTradeCardProps {
  trader: Trader;
  onCopyTrade: (trader: Trader) => void;
  onFollow: (trader: Trader) => void;
}

function getTierConfig(tier: string) {
  switch (tier) {
    case 'diamond':
      return { color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: '💎' };
    case 'platinum':
      return { color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: '🌟' };
    case 'gold':
      return { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: '🥇' };
    case 'silver':
      return { color: 'bg-gray-400/10 text-gray-400 border-gray-400/30', icon: '🥈' };
    default:
      return { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: '🥉' };
  }
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

export function CopyTradeCard({ trader, onCopyTrade, onFollow }: CopyTradeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const tierConfig = getTierConfig(trader.tier);
  const isProfitable = trader.pnl >= 0;

  return (
    <Card
      className={`transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${
        isHovered ? 'border-primary/30 glow-sm' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-bold">
                {trader.alias?.charAt(0) || trader.address.charAt(2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {trader.alias || formatAddress(trader.address)}
                </span>
                {trader.verified && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${tierConfig.color}`}>
                  {tierConfig.icon} {trader.tier}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Score: {trader.score}
                </span>
              </div>
            </div>
          </div>

          {/* PnL Display */}
          <div className="text-right">
            <div className={`flex items-center justify-end gap-1 ${
              isProfitable ? 'text-success' : 'text-destructive'
            }`}>
              {isProfitable ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-lg font-bold">
                {isProfitable ? '+' : ''}${formatNumber(trader.pnl)}
              </span>
            </div>
            <span className={`text-sm ${isProfitable ? 'text-success/80' : 'text-destructive/80'}`}>
              {isProfitable ? '+' : ''}{trader.pnlPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4 py-3 border-y border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className={`text-sm font-semibold ${
              trader.winRate >= 60 ? 'text-success' : trader.winRate >= 50 ? 'text-warning' : 'text-destructive'
            }`}>
              {trader.winRate.toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-sm font-semibold">{formatNumber(trader.trades)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="text-sm font-semibold">{formatNumber(trader.followers)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">AUM</p>
            <p className="text-sm font-semibold">${formatNumber(trader.aum)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onFollow(trader)}
          >
            {trader.isFollowing ? (
              <>
                <Star className="mr-1.5 h-3.5 w-3.5 fill-current" />
                Following
              </>
            ) : (
              <>
                <Users className="mr-1.5 h-3.5 w-3.5" />
                Follow
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
            onClick={() => onCopyTrade(trader)}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


