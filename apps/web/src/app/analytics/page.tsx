'use client';

import { BarChart3 } from 'lucide-react';
import { VolumeChart, TopTokens, ChainDistribution, PlatformStats } from '@/components/analytics';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Analytics
        </h1>
        <p className="mt-2 text-muted-foreground">
          Platform statistics, trading volume, and market insights
        </p>
      </div>

      {/* Platform Stats */}
      <PlatformStats />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolumeChart />
        </div>
        <div>
          <ChainDistribution />
        </div>
      </div>

      {/* Top Tokens */}
      <TopTokens />
    </div>
  );
}
