'use client';

import { PointsOverview } from '@/components/points/points-overview';
import { PointsHistory } from '@/components/points/points-history';
import { PointsTasks } from '@/components/points/points-tasks';
import { PointsLeaderboard } from '@/components/points/points-leaderboard';

export default function PointsPage() {
  return (
    <div className="space-y-6">
      <PointsOverview />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PointsTasks />
          <PointsHistory />
        </div>
        <div>
          <PointsLeaderboard />
        </div>
      </div>
    </div>
  );
}
