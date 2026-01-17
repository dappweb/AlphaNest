'use client';

import { Suspense } from 'react';
import { TrendingTokens } from '@/components/dashboard/trending-tokens';
import { DevLeaderboard } from '@/components/dashboard/dev-leaderboard';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PopCowTooltip } from '@/components/popcow/popcow-tooltip';
import { StakingBanner } from '@/components/dashboard/staking-banner';
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner';
import { useTranslation } from '@/hooks/use-translation';
import { StatsCardSkeleton, ListSkeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

// 懒加载非关键组件
const PopCowTooltipLazy = dynamic(
  () => import('@/components/popcow/popcow-tooltip').then(mod => ({ default: mod.PopCowTooltip })),
  { ssr: false }
);

// 骨架屏组件
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-64 bg-muted rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="h-32 bg-muted rounded-lg animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <ListSkeleton count={5} />
        </div>
        <div className="rounded-lg border p-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <ListSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  
  return (
    <>
      <Suspense fallback={<DashboardSkeleton />}>
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

          {/* 🔥 PopCow DeFi 升级入口 - 最醒目位置 */}
          <Suspense fallback={<div className="h-48 bg-muted rounded-lg animate-pulse" />}>
            <UpgradeBanner />
          </Suspense>

          {/* 质押挖矿入口 */}
          <Suspense fallback={<div className="h-32 bg-muted rounded-lg animate-pulse" />}>
            <StakingBanner />
          </Suspense>

          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          }>
            <StatsOverview />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={
              <div className="rounded-lg border p-6">
                <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
                <ListSkeleton count={5} />
              </div>
            }>
              <TrendingTokens />
            </Suspense>
            <Suspense fallback={
              <div className="rounded-lg border p-6">
                <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
                <ListSkeleton count={5} />
              </div>
            }>
              <DevLeaderboard />
            </Suspense>
          </div>

          {/* Recent Activity */}
          <Suspense fallback={
            <div className="rounded-lg border p-6">
              <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
              <ListSkeleton count={3} />
            </div>
          }>
            <div className="animate-fade-in-up">
              <RecentActivity />
            </div>
          </Suspense>
        </div>
      </Suspense>
      
      {/* PopCow 智能助手 - 懒加载 */}
      <PopCowTooltipLazy />
    </>
  );
}
