import { DevLeaderboard } from '@/components/dashboard/dev-leaderboard';

export default function DevsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dev Rankings</h1>
        <p className="mt-2 text-muted-foreground">
          Track the most successful token developers by reputation score and win rate
        </p>
      </div>
      <DevLeaderboard />
    </div>
  );
}
