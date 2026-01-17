'use client';

import { Suspense } from 'react';
import { ProposalList } from '@/components/governance/proposal-list';
import { CreateProposalModal } from '@/components/governance/create-proposal-modal';
import { GovernanceStats } from '@/components/governance/governance-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote, FileText, TrendingUp, Users, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { ListSkeleton } from '@/components/ui/skeleton';

export default function GovernancePage() {
  const { t } = useTranslation();
  const { connected } = useWallet();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Vote className="h-8 w-8 text-primary" />
            Governance
          </h1>
          <p className="text-muted-foreground mt-1">
            Participate in DAO governance and vote on proposals
          </p>
        </div>
        {connected && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        )}
        {!connected && (
          <WalletMultiButton />
        )}
      </div>

      {/* Governance Stats */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <GovernanceStats />
      </Suspense>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your voting power is based on your PopCowDefi token holdings. 1 token = 1 vote.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 100,000 tokens required to create a proposal.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Voting Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each proposal has a 7-day voting period. Proposals need &gt;50% support to pass.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Proposal Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Parameter Change</Badge>
              <Badge variant="outline">Treasury Spending</Badge>
              <Badge variant="outline">Feature Launch</Badge>
              <Badge variant="outline">Token Distribution</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <ListSkeleton count={5} />
          </CardContent>
        </Card>
      }>
        <ProposalList />
      </Suspense>

      {/* Create Proposal Modal */}
      {isCreateModalOpen && (
        <CreateProposalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
