'use client';

import { useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD } from '@/lib/utils';
import { useUserPolicies, useClaimPayout, Position } from '@/hooks/use-alphaguard';

interface PolicyDisplay {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  position: 'rug' | 'safe';
  premiumPaid: number;
  coverageAmount: number;
  potentialPayout: number;
  status: 'active' | 'claimed' | 'expired' | 'won' | 'lost';
  expiresAt: string;
  payout?: number;
  policyId: number;
}

// Mock policies - in production, combine with contract data
const mockPolicies: PolicyDisplay[] = [
  {
    id: 'POL-001',
    tokenName: 'STAR',
    tokenSymbol: 'STAR',
    position: 'rug',
    premiumPaid: 50,
    coverageAmount: 1000,
    potentialPayout: 2500,
    status: 'active',
    expiresAt: '2024-12-20',
    policyId: 1,
  },
  {
    id: 'POL-002',
    tokenName: 'ALPHA',
    tokenSymbol: 'ALPHA',
    position: 'safe',
    premiumPaid: 100,
    coverageAmount: 2000,
    potentialPayout: 2800,
    status: 'won',
    expiresAt: '2024-12-15',
    payout: 2800,
    policyId: 2,
  },
  {
    id: 'POL-003',
    tokenName: 'BETA',
    tokenSymbol: 'BETA',
    position: 'rug',
    premiumPaid: 75,
    coverageAmount: 1500,
    potentialPayout: 3000,
    status: 'lost',
    expiresAt: '2024-12-10',
    policyId: 3,
  },
  {
    id: 'POL-004',
    tokenName: 'GAMMA',
    tokenSymbol: 'GAMMA',
    position: 'safe',
    premiumPaid: 200,
    coverageAmount: 4000,
    potentialPayout: 5600,
    status: 'claimed',
    expiresAt: '2024-12-05',
    payout: 5600,
    policyId: 4,
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          <Clock className="h-3 w-3 mr-1" /> Active
        </Badge>
      );
    case 'won':
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <TrendingUp className="h-3 w-3 mr-1" /> Won
        </Badge>
      );
    case 'claimed':
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          <CheckCircle className="h-3 w-3 mr-1" /> Claimed
        </Badge>
      );
    case 'lost':
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <TrendingDown className="h-3 w-3 mr-1" /> Lost
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Expired
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function MyPolicies() {
  const { isConnected } = useAccount();
  const { policyIds, isLoading: isLoadingPolicies } = useUserPolicies();
  const { claimPayout, isLoading: isClaiming, isSuccess: isClaimSuccess } = useClaimPayout();
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const handleClaim = (policyId: number) => {
    setClaimingId(policyId);
    claimPayout(policyId);
  };

  // Use mock data for display
  const policies = mockPolicies;

  // Calculate totals
  const totalInvested = policies.reduce((acc, p) => acc + p.premiumPaid, 0);
  const totalWon = policies.filter(p => p.status === 'claimed' || p.status === 'won').reduce((acc, p) => acc + (p.payout || 0), 0);
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const winRate = policies.length > 0 
    ? ((policies.filter(p => p.status === 'won' || p.status === 'claimed').length / policies.filter(p => p.status !== 'active').length) * 100) || 0
    : 0;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Connect your wallet to view your policies</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Policies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-xl font-bold">{formatUSD(totalInvested)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Total Won</p>
            <p className="text-xl font-bold text-success">{formatUSD(totalWon)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Active Policies</p>
            <p className="text-xl font-bold">{activePolicies}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-xl font-bold">{winRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Policies List */}
        {policies.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>You don&apos;t have any insurance policies yet.</p>
            <p className="text-sm">Purchase coverage above to protect your investments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  policy.status === 'won' ? 'border-success/30 bg-success/5' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                    {policy.tokenSymbol.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{policy.tokenName}</span>
                      <Badge
                        variant={policy.position === 'rug' ? 'destructive' : 'success'}
                        className="text-xs"
                      >
                        {policy.position === 'rug' ? '🔻 Bet Rug' : '🔺 Bet Safe'}
                      </Badge>
                      {getStatusBadge(policy.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Policy #{policy.id} • Expires {policy.expiresAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Premium Paid</p>
                    <p className="font-medium">{formatUSD(policy.premiumPaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="font-medium">{formatUSD(policy.coverageAmount)}</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-muted-foreground">
                      {policy.status === 'claimed' ? 'Payout' : policy.status === 'won' ? 'Winnings' : 'Potential'}
                    </p>
                    <p className={`font-bold ${
                      policy.status === 'won' || policy.status === 'claimed' ? 'text-success' : ''
                    }`}>
                      {formatUSD(policy.payout || policy.potentialPayout)}
                    </p>
                  </div>
                  {policy.status === 'won' && (
                    <Button 
                      onClick={() => handleClaim(policy.policyId)}
                      disabled={isClaiming && claimingId === policy.policyId}
                      className="bg-success hover:bg-success/90"
                    >
                      {isClaiming && claimingId === policy.policyId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        'Claim'
                      )}
                    </Button>
                  )}
                  {policy.status === 'active' && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
