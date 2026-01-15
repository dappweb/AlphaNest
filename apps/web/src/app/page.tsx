'use client';

import { TrendingTokens } from '@/components/dashboard/trending-tokens';
import { DevLeaderboard } from '@/components/dashboard/dev-leaderboard';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PopCowTooltip } from '@/components/popcow/popcow-tooltip';
import { StakingBanner } from '@/components/dashboard/staking-banner';
import { useTranslation } from '@/hooks/use-translation';

export default function HomePage() {
  const { t } = useTranslation();
  
  return (
    <>
<div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              {t.dashboard.title}
            </h1>
            <p className="text-muted-foreground">
              {t.dashboard.subtitle}
            </p>
          </div>
        </div>

        {/* 质押挖矿入口 - 最醒目位置 */}
        <StakingBanner />

        <StatsOverview />

        <div className="grid gap-6 lg:grid-cols-2">
          <TrendingTokens />
          <DevLeaderboard />
        </div>

        {/* Recent Activity */}
        <div className="animate-fade-in-up">
          <RecentActivity />
        </div>
      </div>
      
      {/* PopCow 智能助手 */}
      <PopCowTooltip />
    </>
  );
}
