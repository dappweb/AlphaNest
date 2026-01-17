'use client';

import { KOLTrackerDashboard } from '@/components/kol/kol-tracker-dashboard';

export default function SmartMoneyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Money Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track KOL wallets and smart money movements
        </p>
      </div>
      <KOLTrackerDashboard />
    </div>
  );
}
