import { TrendingTokens } from '@/components/dashboard/trending-tokens';
import { DevLeaderboard } from '@/components/dashboard/dev-leaderboard';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to AlphaNest - Your gateway to curated Meme assets
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
  );
}
