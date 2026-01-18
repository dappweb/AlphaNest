'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Loader2, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { useReferralRecords, type ReferralRecord } from '@/hooks/use-referral';
import { cn } from '@/lib/utils';

interface ReferralRecordsProps {
  className?: string;
  limit?: number;
}

function getStatusBadge(status: ReferralRecord['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px]">
          <CheckCircle className="h-2.5 w-2.5 mr-1" />
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-[10px]">
          <Clock className="h-2.5 w-2.5 mr-1" />
          Pending
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-[10px]">
          <XCircle className="h-2.5 w-2.5 mr-1" />
          Inactive
        </Badge>
      );
    default:
      return null;
  }
}

function getChainBadge(chain: ReferralRecord['chain']) {
  if (chain === 'bsc') {
    return (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-[8px]">
        BSC
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-[8px]">
      SOL
    </Badge>
  );
}

function formatAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ReferralRecords({ className, limit }: ReferralRecordsProps) {
  const { records, isLoading } = useReferralRecords();

  const displayRecords = limit ? records.slice(0, limit) : records;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-blue-500" />
            Referrals
          </div>
          {records.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {records.length} total
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3">
        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No referrals yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Share your code to start earning!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold">
                    {record.address.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {formatAddress(record.address)}
                      </span>
                      {getChainBadge(record.chain)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Joined {record.joinedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Staked</p>
                    <p className="text-sm font-medium">${record.totalStaked.toLocaleString()}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Your Reward</p>
                    <p className="text-sm font-medium text-green-500">
                      +${record.rewardGenerated.toFixed(2)}
                    </p>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              </div>
            ))}

            {limit && records.length > limit && (
              <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground">
                View all {records.length} referrals
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 简化版推荐列表 (用于仪表板)
 */
export function RecentReferrals({ className }: { className?: string }) {
  const { records, isLoading } = useReferralRecords();
  const recentRecords = records.slice(0, 3);

  if (isLoading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No referrals yet. Share your code!
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {recentRecords.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
              {record.address.slice(2, 4).toUpperCase()}
            </div>
            <span className="font-mono text-xs">
              {formatAddress(record.address)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-500">+${record.rewardGenerated.toFixed(2)}</span>
            {getStatusBadge(record.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
