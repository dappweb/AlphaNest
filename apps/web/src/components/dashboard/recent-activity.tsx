'use client';

import { ArrowUpRight, ArrowDownRight, Shield, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatUSD } from '@/lib/utils';

type ActivityType = 'buy' | 'sell' | 'insurance' | 'launch';

interface Activity {
  id: number;
  type: ActivityType;
  token: string;
  amount: number;
  user: string;
  timestamp: string;
  chain: string;
}

const recentActivity: Activity[] = [
  {
    id: 1,
    type: 'buy',
    token: 'PEPE',
    amount: 12500,
    user: '0x1234...5678',
    timestamp: '2 mins ago',
    chain: 'Base',
  },
  {
    id: 2,
    type: 'insurance',
    token: 'WOJAK',
    amount: 5000,
    user: '0xabcd...ef12',
    timestamp: '5 mins ago',
    chain: 'Solana',
  },
  {
    id: 3,
    type: 'sell',
    token: 'BONK',
    amount: 8900,
    user: '0x5678...9abc',
    timestamp: '8 mins ago',
    chain: 'Solana',
  },
  {
    id: 4,
    type: 'launch',
    token: 'MOON',
    amount: 0,
    user: '0xdef0...1234',
    timestamp: '12 mins ago',
    chain: 'Base',
  },
  {
    id: 5,
    type: 'buy',
    token: 'DOGE2',
    amount: 3400,
    user: '0x9abc...def0',
    timestamp: '15 mins ago',
    chain: 'BNB',
  },
  {
    id: 6,
    type: 'insurance',
    token: 'SHIB2',
    amount: 2100,
    user: '0x3456...7890',
    timestamp: '18 mins ago',
    chain: 'Base',
  },
];

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'buy':
      return <ArrowUpRight className="h-4 w-4 text-success" />;
    case 'sell':
      return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    case 'insurance':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'launch':
      return <Rocket className="h-4 w-4 text-purple-500" />;
  }
}

function getActivityLabel(type: ActivityType) {
  switch (type) {
    case 'buy':
      return { text: 'Buy', variant: 'success' as const };
    case 'sell':
      return { text: 'Sell', variant: 'destructive' as const };
    case 'insurance':
      return { text: 'Insurance', variant: 'secondary' as const };
    case 'launch':
      return { text: 'Launch', variant: 'default' as const };
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity) => {
            const label = getActivityLabel(activity.type);
            return (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={label.variant}>{label.text}</Badge>
                      <span className="font-medium">${activity.token}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by {activity.user} on {activity.chain}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount > 0 && (
                    <p className="font-medium">{formatUSD(activity.amount)}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
