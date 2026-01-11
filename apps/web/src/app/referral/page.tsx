'use client';

import { ReferralLink, ReferralStats, ReferralHistory, ReferralLeaderboard } from '@/components/referral';

export default function ReferralPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Invite friends and earn rewards on every trade they make
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <ReferralLink />
          <ReferralStats />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ReferralLeaderboard />
          <ReferralHistory />
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-6">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              1
            </div>
            <h3 className="font-semibold">Share Your Link</h3>
            <p className="text-sm text-muted-foreground">
              Copy your unique referral link and share it with friends
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              2
            </div>
            <h3 className="font-semibold">Friends Join</h3>
            <p className="text-sm text-muted-foreground">
              When they connect their wallet using your link, they become your referral
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              3
            </div>
            <h3 className="font-semibold">Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Earn up to 25% of trading fees from every trade they make
            </p>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="rounded-xl border p-6">
        <h2 className="text-xl font-bold mb-4">Tier Benefits</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium">Tier</th>
                <th className="pb-3 font-medium">Referrals Required</th>
                <th className="pb-3 font-medium">Reward Rate</th>
                <th className="pb-3 font-medium">Bonus Multiplier</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3"><span className="text-gray-400">Starter</span></td>
                <td className="py-3">0</td>
                <td className="py-3">10%</td>
                <td className="py-3">1x</td>
              </tr>
              <tr>
                <td className="py-3"><span className="text-amber-600">Bronze</span></td>
                <td className="py-3">5</td>
                <td className="py-3">12%</td>
                <td className="py-3">1.1x</td>
              </tr>
              <tr>
                <td className="py-3"><span className="text-gray-300">Silver</span></td>
                <td className="py-3">15</td>
                <td className="py-3">15%</td>
                <td className="py-3">1.25x</td>
              </tr>
              <tr>
                <td className="py-3"><span className="text-yellow-500">Gold</span></td>
                <td className="py-3">50</td>
                <td className="py-3">18%</td>
                <td className="py-3">1.5x</td>
              </tr>
              <tr>
                <td className="py-3"><span className="text-cyan-400">Platinum</span></td>
                <td className="py-3">100</td>
                <td className="py-3">20%</td>
                <td className="py-3">2x</td>
              </tr>
              <tr>
                <td className="py-3"><span className="text-purple-400">Diamond</span></td>
                <td className="py-3">500</td>
                <td className="py-3">25%</td>
                <td className="py-3">3x</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
