'use client';

import { useState, useMemo } from 'react';
import { Search, TrendingUp, Users, DollarSign, Target, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CopyTradeList } from './copy-trade-list';
import { TraderLeaderboard } from './trader-leaderboard';
import { CopyTradeModal, CopyTradeSettings } from './copy-trade-modal';
import { Trader } from './copy-trade-card';

// Mock data
const mockTraders: Trader[] = [
  {
    address: '0x1234...5678',
    alias: 'DiamondHands',
    verified: true,
    tier: 'diamond',
    score: 95,
    pnl: 2450000,
    pnlPercent: 312.5,
    winRate: 78,
    trades: 1247,
    followers: 8934,
    aum: 15600000,
    isFollowing: false,
  },
  {
    address: '0x2345...6789',
    alias: 'MemeWhale',
    verified: true,
    tier: 'platinum',
    score: 88,
    pnl: 1890000,
    pnlPercent: 245.8,
    winRate: 72,
    trades: 892,
    followers: 5621,
    aum: 8900000,
    isFollowing: true,
  },
  {
    address: '0x3456...7890',
    alias: 'AlphaSeeker',
    verified: true,
    tier: 'gold',
    score: 82,
    pnl: 945000,
    pnlPercent: 156.2,
    winRate: 68,
    trades: 654,
    followers: 3245,
    aum: 4200000,
    isFollowing: false,
  },
  {
    address: '0x4567...8901',
    alias: 'CryptoNinja',
    verified: false,
    tier: 'gold',
    score: 79,
    pnl: 720000,
    pnlPercent: 124.5,
    winRate: 65,
    trades: 489,
    followers: 2156,
    aum: 2800000,
    isFollowing: false,
  },
  {
    address: '0x5678...9012',
    alias: 'DeFiMaster',
    verified: true,
    tier: 'silver',
    score: 74,
    pnl: 385000,
    pnlPercent: 89.3,
    winRate: 61,
    trades: 345,
    followers: 1423,
    aum: 1500000,
    isFollowing: false,
  },
  {
    address: '0x6789...0123',
    alias: 'TokenHunter',
    verified: false,
    tier: 'silver',
    score: 71,
    pnl: 256000,
    pnlPercent: 72.1,
    winRate: 58,
    trades: 278,
    followers: 892,
    aum: 920000,
    isFollowing: true,
  },
  {
    address: '0x7890...1234',
    alias: 'MoonBoy',
    verified: false,
    tier: 'bronze',
    score: 65,
    pnl: -45000,
    pnlPercent: -12.5,
    winRate: 45,
    trades: 156,
    followers: 234,
    aum: 180000,
    isFollowing: false,
  },
  {
    address: '0x8901...2345',
    alias: 'SmartMoney',
    verified: true,
    tier: 'platinum',
    score: 86,
    pnl: 1250000,
    pnlPercent: 198.4,
    winRate: 70,
    trades: 734,
    followers: 4512,
    aum: 6800000,
    isFollowing: false,
  },
];

type FilterType = 'all' | 'verified' | 'following' | 'top10';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

function StatsCard({ icon, label, value, change, changeType }: StatsCardProps) {
  return (
    <Card className="bg-gradient-to-br from-card to-card/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{value}</p>
              {change && (
                <span className={`text-xs ${
                  changeType === 'positive' ? 'text-success' : 'text-destructive'
                }`}>
                  {change}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CopyTradePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('explore');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [traders, setTraders] = useState<Trader[]>(mockTraders);

  const filteredTraders = useMemo(() => {
    let result = [...traders];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.alias?.toLowerCase().includes(query) ||
          t.address.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    switch (filter) {
      case 'verified':
        result = result.filter((t) => t.verified);
        break;
      case 'following':
        result = result.filter((t) => t.isFollowing);
        break;
      case 'top10':
        result = result.sort((a, b) => b.pnl - a.pnl).slice(0, 10);
        break;
    }

    return result;
  }, [traders, searchQuery, filter]);

  const stats = useMemo(() => {
    const totalPnl = traders.reduce((acc, t) => acc + t.pnl, 0);
    const totalFollowers = traders.reduce((acc, t) => acc + t.followers, 0);
    const avgWinRate = traders.reduce((acc, t) => acc + t.winRate, 0) / traders.length;
    const following = traders.filter((t) => t.isFollowing).length;

    return { totalPnl, totalFollowers, avgWinRate, following };
  }, [traders]);

  const handleCopyTrade = (trader: Trader) => {
    setSelectedTrader(trader);
    setIsModalOpen(true);
  };

  const handleFollow = (trader: Trader) => {
    setTraders((prev) =>
      prev.map((t) =>
        t.address === trader.address ? { ...t, isFollowing: !t.isFollowing } : t
      )
    );
  };

  const handleConfirmCopyTrade = (settings: CopyTradeSettings) => {
    console.log('Copy trade confirmed:', settings);
    // TODO: Integrate with API
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Copy Trading</h1>
        <p className="text-muted-foreground mt-2">
          Follow top traders and automatically mirror their winning strategies
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label="Total PnL"
          value={`$${(stats.totalPnl / 1_000_000).toFixed(1)}M`}
          change="+24.5%"
          changeType="positive"
        />
        <StatsCard
          icon={<Users className="h-5 w-5 text-primary" />}
          label="Active Traders"
          value={traders.length.toString()}
        />
        <StatsCard
          icon={<Target className="h-5 w-5 text-primary" />}
          label="Avg Win Rate"
          value={`${stats.avgWinRate.toFixed(0)}%`}
        />
        <StatsCard
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          label="Your Following"
          value={stats.following.toString()}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="my-trades">My Copy Trades</TabsTrigger>
          </TabsList>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search traders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(['all', 'verified', 'following', 'top10'] as FilterType[]).map((f) => (
            <Badge
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'All Traders'}
              {f === 'verified' && 'Verified Only'}
              {f === 'following' && 'Following'}
              {f === 'top10' && 'Top 10'}
            </Badge>
          ))}
        </div>

        <TabsContent value="explore" className="mt-6">
          <CopyTradeList
            traders={filteredTraders}
            onCopyTrade={handleCopyTrade}
            onFollow={handleFollow}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <TraderLeaderboard
            traders={traders}
            onCopyTrade={handleCopyTrade}
            onFollow={handleFollow}
          />
        </TabsContent>

        <TabsContent value="my-trades" className="mt-6">
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Active Copy Trades</h3>
                <p className="text-muted-foreground mt-1">
                  Start copying a trader to see your positions here
                </p>
              </div>
              <Button onClick={() => setActiveTab('explore')}>
                Explore Traders
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Copy Trade Modal */}
      <CopyTradeModal
        trader={selectedTrader}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrader(null);
        }}
        onConfirm={handleConfirmCopyTrade}
      />
    </div>
  );
}


