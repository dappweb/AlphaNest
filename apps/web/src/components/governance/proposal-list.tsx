'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatNumber, formatTimeAgo } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { VoteModal } from './vote-modal';
import { ListSkeleton } from '@/components/ui/skeleton';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  proposalType: 'ParameterChange' | 'TreasurySpending' | 'FeatureLaunch' | 'TokenDistribution';
  status: 'Active' | 'Executed' | 'Rejected' | 'Cancelled';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  createdAt: number;
  votingEndTime: number;
  executed: boolean;
}

export function ProposalList() {
  const { publicKey } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from governance contract
    // For now, use mock data
    const mockProposals: Proposal[] = [
      {
        id: '1',
        title: 'Increase Staking APY to 150%',
        description: 'Proposal to increase the staking APY from 116% to 150% to attract more stakers.',
        author: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        proposalType: 'ParameterChange',
        status: 'Active',
        votesFor: 8500000,
        votesAgainst: 1200000,
        totalVotes: 9700000,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        votingEndTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
        executed: false,
      },
      {
        id: '2',
        title: 'Treasury Spending: Marketing Campaign',
        description: 'Allocate 500,000 USDC from treasury for Q1 2026 marketing campaign.',
        author: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        proposalType: 'TreasurySpending',
        status: 'Active',
        votesFor: 3200000,
        votesAgainst: 1800000,
        totalVotes: 5000000,
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        votingEndTime: Date.now() + 6 * 24 * 60 * 60 * 1000,
        executed: false,
      },
      {
        id: '3',
        title: 'Launch Cross-Chain Bridge Feature',
        description: 'Proposal to launch the cross-chain bridge feature to enable multi-chain token transfers.',
        author: 'GjJyeC1rB1h3aZz3J3K3K3K3K3K3K3K3K3K3K3K3K3K',
        proposalType: 'FeatureLaunch',
        status: 'Executed',
        votesFor: 12000000,
        votesAgainst: 3000000,
        totalVotes: 15000000,
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        votingEndTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
        executed: true,
      },
    ];

    setTimeout(() => {
      setProposals(mockProposals);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleVote = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsVoteModalOpen(true);
  };

  const getStatusBadge = (status: Proposal['status']) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-green-500/10 text-green-500">Active</Badge>;
      case 'Executed':
        return <Badge variant="default" className="bg-blue-500/10 text-blue-500">Executed</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'Cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
    }
  };

  const getProposalTypeBadge = (type: Proposal['proposalType']) => {
    const types = {
      ParameterChange: { label: 'Parameter', variant: 'default' as const },
      TreasurySpending: { label: 'Treasury', variant: 'default' as const },
      FeatureLaunch: { label: 'Feature', variant: 'default' as const },
      TokenDistribution: { label: 'Distribution', variant: 'default' as const },
    };
    const typeInfo = types[type];
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton count={5} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const supportRate = proposal.totalVotes > 0
                ? (proposal.votesFor / proposal.totalVotes) * 100
                : 0;
              const isActive = proposal.status === 'Active';
              const canVote = isActive && publicKey && !proposal.executed;
              const timeRemaining = proposal.votingEndTime - Date.now();
              const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));

              return (
                <div
                  key={proposal.id}
                  className="rounded-lg border p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{proposal.title}</h3>
                        {getStatusBadge(proposal.status)}
                        {getProposalTypeBadge(proposal.proposalType)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {proposal.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-mono">
                            {proposal.author.slice(0, 4)}...{proposal.author.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {isActive
                              ? `${daysRemaining} days remaining`
                              : formatTimeAgo(proposal.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voting Progress */}
                  {isActive && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">
                            For: {formatNumber(proposal.votesFor)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="text-red-500">
                            Against: {formatNumber(proposal.votesAgainst)}
                          </span>
                        </div>
                      </div>
                      <Progress value={supportRate} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{supportRate.toFixed(1)}% support</span>
                        <span>Total: {formatNumber(proposal.totalVotes)} votes</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {canVote && (
                      <Button
                        size="sm"
                        onClick={() => handleVote(proposal)}
                        className="flex items-center gap-2"
                      >
                        <Vote className="h-4 w-4" />
                        Vote
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://solscan.io/account/${proposal.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Solscan
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedProposal && (
        <VoteModal
          isOpen={isVoteModalOpen}
          onClose={() => {
            setIsVoteModalOpen(false);
            setSelectedProposal(null);
          }}
          proposal={selectedProposal}
        />
      )}
    </>
  );
}
