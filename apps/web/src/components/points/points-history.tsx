'use client';

import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PointsTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
  source: string;
}

const MOCK_HISTORY: PointsTransaction[] = [
  {
    id: '1',
    type: 'earned',
    amount: 100,
    description: 'Daily check-in bonus',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    source: 'daily-task',
  },
  {
    id: '2',
    type: 'earned',
    amount: 250,
    description: 'Weekly trading volume milestone',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    source: 'weekly-task',
  },
  {
    id: '3',
    type: 'bonus',
    amount: 500,
    description: '7-day streak bonus',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    source: 'streak',
  },
  {
    id: '4',
    type: 'earned',
    amount: 50,
    description: 'Shared on Twitter',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    source: 'social',
  },
  {
    id: '5',
    type: 'spent',
    amount: -200,
    description: 'Redeemed for fee discount',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    source: 'redeem',
  },
  {
    id: '6',
    type: 'earned',
    amount: 1000,
    description: 'Referral bonus - Alice joined',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    source: 'referral',
  },
];

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function PointsHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Points History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {MOCK_HISTORY.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    tx.type === 'spent'
                      ? 'bg-destructive/10 text-destructive'
                      : tx.type === 'bonus'
                      ? 'bg-purple-500/10 text-purple-500'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {tx.type === 'spent' ? (
                    <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(tx.timestamp)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold ${
                    tx.amount > 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
                {tx.type === 'bonus' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Bonus
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
          View All History →
        </button>
      </CardContent>
    </Card>
  );
}
