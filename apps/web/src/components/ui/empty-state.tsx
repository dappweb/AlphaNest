'use client';

import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Common empty state presets
export function EmptyWallet() {
  return (
    <EmptyState
      icon={<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">💼</div>}
      title="No tokens found"
      description="Connect your wallet to view your portfolio holdings"
    />
  );
}

export function EmptyTransactions() {
  return (
    <EmptyState
      icon={<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">📋</div>}
      title="No transactions yet"
      description="Your transaction history will appear here once you make transactions"
    />
  );
}

export function EmptyTraders() {
  return (
    <EmptyState
      icon={<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">👥</div>}
      title="No traders found"
      description="Try adjusting your search or filters"
    />
  );
}

export function EmptyCopyTrades() {
  return (
    <EmptyState
      icon={<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">📊</div>}
      title="No active copy trades"
      description="Start copying a trader to see your positions here"
      action={{
        label: 'Explore Traders',
        onClick: () => {
          // Navigate to traders page
          if (typeof window !== 'undefined') {
            window.location.href = '/copy-trade';
          }
        },
      }}
    />
  );
}
