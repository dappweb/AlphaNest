'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { TrendingUp, Users, Trophy, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTopCopyTraders, useCopySettings, useRecommendedTraders } from '@/hooks/use-copy-trading';

export default function CopyTradingPage() {
  const { isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { traders: topTraders, isLoading: isLoadingTop } = useTopCopyTraders(10);
  const { traders: recommended, isLoading: isLoadingRecommended } = useRecommendedTraders(5);
  const { settings, startCopyTrading, stopCopyTrading, updateSettings } = useCopySettings();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">Copy Trading</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Follow expert traders and automatically copy their trades. 
          Earn like the pros without spending years learning.
        </p>
        <div className="flex justify-center gap-4">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <TrendingUp className="h-4 w-4 mr-1" />
            85% Avg Success Rate
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Users className="h-4 w-4 mr-1" />
            10,000+ Active Traders
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Trophy className="h-4 w-4 mr-1" />
            $50M+ Copied Volume
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-copies">My Copies</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Traders</CardTitle>
              <CardDescription>Find traders by name or address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Search traders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Traders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Recommended for You
              </CardTitle>
              <CardDescription>Based on your trading preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {recommended.map((trader) => (
                  <TraderCard key={trader.id} trader={trader} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Traders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Top Performing Traders
              </CardTitle>
              <CardDescription>Best performers this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {topTraders.map((trader) => (
                  <TraderCard key={trader.id} trader={trader} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Copies Tab */}
        <TabsContent value="my-copies" className="space-y-6">
          {!isConnected ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Connect your wallet to view your copy trading settings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {settings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">No active copy trades yet</p>
                    <Button className="mt-4">Start Copy Trading</Button>
                  </CardContent>
                </Card>
              ) : (
                settings.map((setting) => (
                  <Card key={setting.traderAddress}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Trader #{setting.traderAddress.slice(0, 8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            Copy Amount: ${setting.copyAmount}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={setting.isActive ? 'default' : 'secondary'}>
                            {setting.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant={setting.isActive ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => {
                              if (setting.isActive) {
                                stopCopyTrading(setting.traderAddress);
                              } else {
                                startCopyTrading(setting.traderAddress, setting);
                              }
                            }}
                          >
                            {setting.isActive ? 'Stop' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {!isConnected ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Connect your wallet to view performance</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">+24.5%</p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">78.3%</p>
                  <p className="text-sm text-muted-foreground">156 trades</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$12,450</p>
                  <p className="text-sm text-muted-foreground">Copied trades</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {!isConnected ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Connect your wallet to configure settings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Default Copy Settings</CardTitle>
                  <CardDescription>Configure your default copy trading preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyRatio">Copy Ratio (%)</Label>
                    <Input
                      id="copyRatio"
                      type="number"
                      placeholder="50"
                      min="10"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAmount">Max Amount per Trade ($)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      placeholder="500"
                      min="10"
                      max="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      placeholder="20"
                      min="5"
                      max="50"
                    />
                  </div>
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                  <CardDescription>Control your risk exposure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Stop Loss</p>
                      <p className="text-sm text-muted-foreground">Automatically stop losing trades</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Limit</p>
                      <p className="text-sm text-muted-foreground">Limit daily trading volume</p>
                    </div>
                    <Button variant="outline" size="sm">Set</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Blacklist Tokens</p>
                      <p className="text-sm text-muted-foreground">Exclude specific tokens</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Trader Card Component
function TraderCard({ trader }: { trader: any }) {
  const { isConnected } = useAccount();
  const { startCopyTrading } = useCopySettings();

  return (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{trader.alias}</h3>
              <p className="text-sm text-muted-foreground">
                {trader.stats.followers} followers
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-500">
                +{trader.performance.monthlyReturn}%
              </span>
              <Badge variant="secondary">
                {trader.stats.winRate}% win rate
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {trader.stats.totalTrades} trades
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline">
              Risk: {trader.preferences.riskLevel}
            </Badge>
            {trader.isVerified && (
              <Badge className="bg-green-500/10 text-green-500">
                Verified
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            disabled={!isConnected}
            onClick={() => {
              if (isConnected) {
                startCopyTrading(trader.id, {
                  copyAmount: 100,
                  maxCopyAmount: 500,
                  stopLoss: 0.2,
                  takeProfit: 0.5,
                  copyBuy: true,
                  copySell: true,
                  isActive: true,
                });
              }
            }}
          >
            {isConnected ? 'Copy Trader' : 'Connect Wallet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
