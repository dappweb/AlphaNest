'use client';

import { CopyTradeCard, Trader } from './copy-trade-card';
import { Skeleton } from '@/components/ui/skeleton';

interface CopyTradeListProps {
  traders: Trader[];
  isLoading?: boolean;
  onCopyTrade: (trader: Trader) => void;
  onFollow: (trader: Trader) => void;
}

function TraderCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4 py-3 border-y border-border/50">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-3 w-10 mx-auto mb-1" />
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  );
}

export function CopyTradeList({ traders, isLoading, onCopyTrade, onFollow }: CopyTradeListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <TraderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (traders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No traders found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {traders.map((trader) => (
        <CopyTradeCard
          key={trader.address}
          trader={trader}
          onCopyTrade={onCopyTrade}
          onFollow={onFollow}
        />
      ))}
    </div>
  );
}


