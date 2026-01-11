'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, CheckCircle, Copy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatAddress } from '@/lib/utils';
import { Trader } from './copy-trade-card';

interface TraderLeaderboardProps {
  traders: Trader[];
  onCopyTrade: (trader: Trader) => void;
  onFollow: (trader: Trader) => void;
}

type SortKey = 'pnl' | 'pnlPercent' | 'winRate' | 'followers' | 'aum';
type SortOrder = 'asc' | 'desc';

function getTierConfig(tier: string) {
  switch (tier) {
    case 'diamond':
      return { color: 'text-cyan-400', icon: '💎' };
    case 'platinum':
      return { color: 'text-purple-400', icon: '🌟' };
    case 'gold':
      return { color: 'text-yellow-400', icon: '🥇' };
    case 'silver':
      return { color: 'text-gray-400', icon: '🥈' };
    default:
      return { color: 'text-orange-400', icon: '🥉' };
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

export function TraderLeaderboard({ traders, onCopyTrade, onFollow }: TraderLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>('pnl');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedTraders = [...traders].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * modifier;
  });

  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => {
    if (!active) return <ChevronDown className="h-4 w-4 text-muted-foreground/50" />;
    return order === 'desc' ? (
      <ChevronDown className="h-4 w-4 text-primary" />
    ) : (
      <ChevronUp className="h-4 w-4 text-primary" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top Traders Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground w-12">#</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Trader</th>
                <th 
                  className="text-right py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center justify-end gap-1">
                    PnL
                    <SortIcon active={sortKey === 'pnl'} order={sortOrder} />
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('pnlPercent')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Return
                    <SortIcon active={sortKey === 'pnlPercent'} order={sortOrder} />
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden md:table-cell"
                  onClick={() => handleSort('winRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Win Rate
                    <SortIcon active={sortKey === 'winRate'} order={sortOrder} />
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden lg:table-cell"
                  onClick={() => handleSort('followers')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Followers
                    <SortIcon active={sortKey === 'followers'} order={sortOrder} />
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground hidden lg:table-cell"
                  onClick={() => handleSort('aum')}
                >
                  <div className="flex items-center justify-end gap-1">
                    AUM
                    <SortIcon active={sortKey === 'aum'} order={sortOrder} />
                  </div>
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTraders.map((trader, index) => {
                const tierConfig = getTierConfig(trader.tier);
                const isProfitable = trader.pnl >= 0;

                return (
                  <tr key={trader.address} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-2">
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-400' : 
                        index === 1 ? 'text-gray-400' : 
                        index === 2 ? 'text-orange-400' : 
                        'text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-sm">
                            {trader.alias?.charAt(0) || trader.address.charAt(2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">
                              {trader.alias || formatAddress(trader.address)}
                            </span>
                            {trader.verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                            <span className={tierConfig.color}>{tierConfig.icon}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {trader.trades} trades
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        isProfitable ? 'text-success' : 'text-destructive'
                      }`}>
                        {isProfitable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        <span className="font-semibold">
                          {isProfitable ? '+' : ''}${formatNumber(trader.pnl)}
                        </span>
                      </div>
                    </td>
                    <td className={`py-4 px-2 text-right font-medium ${
                      isProfitable ? 'text-success' : 'text-destructive'
                    }`}>
                      {isProfitable ? '+' : ''}{trader.pnlPercent.toFixed(1)}%
                    </td>
                    <td className={`py-4 px-2 text-right hidden md:table-cell ${
                      trader.winRate >= 60 ? 'text-success' : 
                      trader.winRate >= 50 ? 'text-warning' : 
                      'text-destructive'
                    }`}>
                      {trader.winRate.toFixed(0)}%
                    </td>
                    <td className="py-4 px-2 text-right hidden lg:table-cell text-muted-foreground">
                      {formatNumber(trader.followers)}
                    </td>
                    <td className="py-4 px-2 text-right hidden lg:table-cell text-muted-foreground">
                      ${formatNumber(trader.aum)}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => onFollow(trader)}
                        >
                          <Users className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => onCopyTrade(trader)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


