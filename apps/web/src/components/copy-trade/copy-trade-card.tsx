'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Copy, 
  ExternalLink,
  Shield,
  Star
} from 'lucide-react';

interface TraderStats {
  address: string;
  alias?: string;
  score: number;
  tier: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'unranked';
  verified: boolean;
  totalTrades: number;
  winRate: number;
  pnl30d: number;
  pnlPercent30d: number;
  followers: number;
  isFollowing?: boolean;
}

interface CopyTradeCardProps {
  trader: TraderStats;
  onFollow?: (address: string) => void;
  onUnfollow?: (address: string) => void;
  onViewProfile?: (address: string) => void;
}

const tierConfig = {
  diamond: { color: 'bg-cyan-500', icon: '💎', label: 'Diamond' },
  platinum: { color: 'bg-purple-500', icon: '💠', label: 'Platinum' },
  gold: { color: 'bg-yellow-500', icon: '🥇', label: 'Gold' },
  silver: { color: 'bg-gray-400', icon: '🥈', label: 'Silver' },
  bronze: { color: 'bg-amber-600', icon: '🥉', label: 'Bronze' },
  unranked: { color: 'bg-gray-600', icon: '⚪', label: 'Unranked' },
};

export function CopyTradeCard({ 
  trader, 
  onFollow, 
  onUnfollow, 
  onViewProfile 
}: CopyTradeCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const tierInfo = tierConfig[trader.tier];
  const isProfitable = trader.pnl30d >= 0;

  const handleFollowClick = async () => {
    setIsLoading(true);
    try {
      if (trader.isFollowing) {
        await onUnfollow?.(trader.address);
      } else {
        await onFollow?.(trader.address);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatPnl = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-12 h-12 rounded-full ${tierInfo.color} flex items-center justify-center text-xl`}>
              {tierInfo.icon}
            </div>
            {trader.verified && (
              <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {trader.alias || formatAddress(trader.address)}
              </span>
              {trader.verified && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  Red V
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Score: {trader.score}/100</span>
              <span>•</span>
              <span>{tierInfo.label}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewProfile?.(trader.address)}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
          <div className="text-lg font-semibold text-green-500">
            {trader.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
          <div className="text-lg font-semibold">
            {trader.totalTrades.toLocaleString()}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">30D PnL</div>
          <div className={`text-lg font-semibold flex items-center gap-1 ${
            isProfitable ? 'text-green-500' : 'text-red-500'
          }`}>
            {isProfitable ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {formatPnl(trader.pnl30d)}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Followers</div>
          <div className="text-lg font-semibold flex items-center gap-1">
            <Users className="w-4 h-4" />
            {trader.followers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        className="w-full"
        variant={trader.isFollowing ? "outline" : "default"}
        onClick={handleFollowClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="animate-pulse">Processing...</span>
        ) : trader.isFollowing ? (
          <>
            <Star className="w-4 h-4 mr-2 fill-current" />
            Following
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy Trade
          </>
        )}
      </Button>
    </div>
  );
}
