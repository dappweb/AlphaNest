'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/use-referral';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ReferralHistory() {
  const { records, isConnected, isLoading } = useReferral();

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No referrals yet</p>
            <p className="text-sm mt-1">Share your link to start earning rewards!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-sm font-bold">
                      {record.referredAddress.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {shortenAddress(record.referredAddress)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDistanceToNow(record.referredAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-success">
                      +${record.earnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {record.trades} trades
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(record.status)}>
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
      return 'outline';
    default:
      return 'outline';
  }
}
