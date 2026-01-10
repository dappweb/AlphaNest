'use client';

import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD } from '@/lib/utils';

const policies = [
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
  },
  {
    id: 'POL-002',
    tokenName: 'ALPHA',
    tokenSymbol: 'ALPHA',
    position: 'safe',
    premiumPaid: 100,
    coverageAmount: 2000,
    potentialPayout: 2800,
    status: 'claimed',
    expiresAt: '2024-12-15',
    payout: 2800,
  },
  {
    id: 'POL-003',
    tokenName: 'BETA',
    tokenSymbol: 'BETA',
    position: 'rug',
    premiumPaid: 75,
    coverageAmount: 1500,
    potentialPayout: 3000,
    status: 'expired',
    expiresAt: '2024-12-10',
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Active
        </Badge>
      );
    case 'claimed':
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Claimed
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Policies
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                className="flex items-center justify-between rounded-lg border p-4"
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
                      >
                        {policy.position === 'rug' ? 'Betting Rug' : 'Betting Safe'}
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
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {policy.status === 'claimed' ? 'Payout' : 'Potential'}
                    </p>
                    <p className="font-bold text-success">
                      {formatUSD(policy.payout || policy.potentialPayout)}
                    </p>
                  </div>
                  {policy.status === 'active' && (
                    <Button variant="outline" size="sm">
                      Claim
                    </Button>
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
