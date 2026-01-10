'use client';

import { useState } from 'react';
import { CopyTradeCard } from './copy-trade-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReputation } from '@/hooks/use-reputation';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface CopyTradeListProps {
  type: 'following' | 'discover';
  searchQuery?: string;
}

export function CopyTradeList({ type, searchQuery }: CopyTradeListProps) {
  const { leaderboard, isLoading, error, refetch, follow, unfollow } = useReputation();
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  const handleFollow = async (address: string) => {
    await follow(address);
    setFollowingSet(prev => new Set(prev).add(address));
  };

  const handleUnfollow = async (address: string) => {
    await unfollow(address);
    setFollowingSet(prev => {
      const next = new Set(prev);
      next.delete(address);
      return next;
    });
  };

  const handleViewProfile = (address: string) => {
    window.open(`/devs/${address}`, '_blank');
  };

  // Filter traders based on type and search
  const filteredTraders = leaderboard?.filter(trader => {
    if (type === 'following' && !followingSet.has(trader.address)) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        trader.address.toLowerCase().includes(query) ||
        trader.alias?.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-16 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load traders</h3>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (filteredTraders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {type === 'following' ? '⭐' : '🔍'}
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {type === 'following' ? 'No traders followed yet' : 'No traders found'}
        </h3>
        <p className="text-muted-foreground">
          {type === 'following' 
            ? 'Start following top traders to copy their strategies'
            : 'Try adjusting your search criteria'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTraders.map((trader) => (
        <CopyTradeCard
          key={trader.address}
          trader={{
            address: trader.address,
            alias: trader.alias,
            score: trader.score,
            tier: trader.tier as any,
            verified: trader.verified,
            totalTrades: trader.totalLaunches,
            winRate: trader.winRate,
            pnl30d: parseFloat(trader.totalVolume) * 0.1,
            pnlPercent30d: trader.winRate - 50,
            followers: trader.followers || 0,
            isFollowing: followingSet.has(trader.address),
          }}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onViewProfile={handleViewProfile}
        />
      ))}
    </div>
  );
}
