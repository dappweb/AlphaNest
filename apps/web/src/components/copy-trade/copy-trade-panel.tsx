'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CopyTradeList } from './copy-trade-list';
import { TraderLeaderboard } from './trader-leaderboard';
import { Search, TrendingUp, Users, Star } from 'lucide-react';

export function CopyTradePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Copy Trading</h1>
          <p className="text-muted-foreground">
            Follow top traders and copy their strategies automatically
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search traders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Top Trader PnL</div>
              <div className="text-xl font-bold text-green-500">+$1.2M</div>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Traders</div>
              <div className="text-xl font-bold">1,234</div>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Your Following</div>
              <div className="text-xl font-bold">12</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">
            <TrendingUp className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="following">
            <Star className="w-4 h-4 mr-2" />
            Following
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Users className="w-4 h-4 mr-2" />
            Discover
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard" className="mt-6">
          <TraderLeaderboard searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="following" className="mt-6">
          <CopyTradeList type="following" searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="discover" className="mt-6">
          <CopyTradeList type="discover" searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
