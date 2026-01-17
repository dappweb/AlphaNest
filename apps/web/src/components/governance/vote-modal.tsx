'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Vote, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Proposal } from './proposal-list';
import { Loader2 } from 'lucide-react';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
}

export function VoteModal({ isOpen, onClose, proposal }: VoteModalProps) {
  const { publicKey } = useWallet();
  const [voteChoice, setVoteChoice] = useState<'For' | 'Against' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async () => {
    if (!voteChoice || !publicKey) return;

    setIsSubmitting(true);
    try {
      // TODO: Call governance contract to vote
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Vote submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vote on Proposal</DialogTitle>
          <DialogDescription>
            {proposal.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {proposal.description}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Your Vote</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={voteChoice === 'For' ? 'default' : 'outline'}
                onClick={() => setVoteChoice('For')}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                For
              </Button>
              <Button
                variant={voteChoice === 'Against' ? 'destructive' : 'outline'}
                onClick={() => setVoteChoice('Against')}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Against
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleVote}
              disabled={!voteChoice || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Vote className="h-4 w-4" />
                  Submit Vote
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
