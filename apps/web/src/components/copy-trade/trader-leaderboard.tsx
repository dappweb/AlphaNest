'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReputation } from '@/hooks/use-reputation';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronUp,
  ChevronDown,
  Medal,
  Shield,
  ExternalLink
} from 'lucide-react';

interface TraderLeaderboardProps {
  searchQuery?: string;
}

type SortField = 'score' | 'winRate' | 'volume' | 'pnl';
type SortOrder = 'asc' | 'desc';

const tierConfig = {
  diamond: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: '💎' },
  platinum: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '💠' },
  gold: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🥇' },
  silver: { color: 'text-gray-300', bg: 'bg-gray-500/10', icon: '🥈' },
  bronze: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: '🥉' },
  unranked: { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: '⚪' },
};

export function TraderLeaderboard({ searchQuery }: TraderLeaderboardProps) {
  const { leaderboard, isLoading } = useReputation();
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const filteredAndSortedTraders = (leaderboard || [])
    .filter(trader => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        trader.address.toLowerCase().includes(query) ||
        trader.alias?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'winRate':
          aVal = a.winRate;
          bVal = b.winRate;
          break;
        case 'volume':
          aVal = parseFloat(a.totalVolume);
          bVal = parseFloat(b.totalVolume);
          break;
        case 'pnl':
          aVal = parseFloat(a.totalVolume) * (a.winRate / 100);
          bVal = parseFloat(b.totalVolume) * (b.winRate / 100);
          break;
        default:
          return 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatVolume = (vol: string) => {
    const num = parseFloat(vol);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Trader</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Win Rate</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right">PnL</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3"><Skeleton className="h-5 w-6" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-12 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-14 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                #
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Trader
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center justify-end gap-1">
                  Score <SortIcon field="score" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('winRate')}
              >
                <div className="flex items-center justify-end gap-1">
                  Win Rate <SortIcon field="winRate" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('volume')}
              >
                <div className="flex items-center justify-end gap-1">
                  Volume <SortIcon field="volume" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('pnl')}
              >
                <div className="flex items-center justify-end gap-1">
                  Est. PnL <SortIcon field="pnl" />
                </div>
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTraders.map((trader, index) => {
              const tier = tierConfig[trader.tier as keyof typeof tierConfig] || tierConfig.unranked;
              const estPnl = parseFloat(trader.totalVolume) * (trader.winRate / 100) * 0.1;
              const isProfitable = estPnl >= 0;

              return (
                <tr 
                  key={trader.address} 
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {index < 3 ? (
                        <Medal className={`w-5 h-5 ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          'text-amber-600'
                        }`} />
                      ) : (
                        <span className="text-muted-foreground w-5 text-center">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${tier.bg} flex items-center justify-center`}>
                        <span>{tier.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {trader.alias || formatAddress(trader.address)}
                          </span>
                          {trader.verified && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              <Shield className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trader.totalLaunches} launches
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${tier.color}`}>
                      {trader.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={trader.winRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                      {trader.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatVolume(trader.totalVolume)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`flex items-center justify-end gap-1 ${
                      isProfitable ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isProfitable ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatVolume(Math.abs(estPnl).toString())}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`/devs/${trader.address}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredAndSortedTraders.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No traders found matching your search
        </div>
      )}
    </div>
  );
}
