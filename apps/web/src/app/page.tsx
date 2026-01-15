import { TrendingTokens } from '@/components/dashboard/trending-tokens';
import { DevLeaderboard } from '@/components/dashboard/dev-leaderboard';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PopCowTooltip } from '@/components/popcow/popcow-tooltip';

export default function HomePage() {
  return (
    <>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 p-8 border border-orange-200/20 dark:border-orange-800/20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-600/5 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-4">
                  PopCow Dashboard 🐄
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  Welcome to PopCow - Follow the smartest cow in crypto for Alpha discoveries
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Live Market Data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>AI-Powered Insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <span>Rug Protection</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-4xl animate-bounce">
                  🐄
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="animate-fade-in">
          <StatsOverview />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="animate-slide-in-left">
            <TrendingTokens />
          </div>
          <div className="animate-slide-in-right">
            <DevLeaderboard />
          </div>
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
