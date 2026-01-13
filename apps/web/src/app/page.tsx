import { TrendingTokens } from '@/components/dashboard/trending-tokens';
import { DevLeaderboard } from '@/components/dashboard/dev-leaderboard';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PopCowTooltip } from '@/components/popcow/popcow-tooltip';

export default function HomePage() {
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              PopCow Dashboard 🐄
            </h1>
            <p className="text-muted-foreground">
              Welcome to PopCow - Follow the smartest cow in crypto for Alpha discoveries
            </p>
          </div>
        </div>

        <StatsOverview />

        <div className="grid gap-6 lg:grid-cols-2">
          <TrendingTokens />
          <DevLeaderboard />
        </div>

        <RecentActivity />
      </div>
      
      {/* PopCow 智能助手 */}
      <PopCowTooltip />
    </>
  );
}
