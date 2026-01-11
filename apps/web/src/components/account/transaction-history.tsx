'use client';

import { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Filter,
  Loader2
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatUSD } from '@/lib/utils';
import { useTransactionHistory, type Transaction } from '@/hooks/use-transaction-history';

type TransactionType = 'swap' | 'send' | 'receive' | 'insurance' | 'stake' | 'claim';
type TransactionStatus = 'pending' | 'confirmed' | 'failed';

function getTypeIcon(type: TransactionType) {
  switch (type) {
    case 'swap':
      return <ArrowRightLeft className="h-4 w-4" />;
    case 'send':
      return <ArrowUpRight className="h-4 w-4" />;
    case 'receive':
      return <ArrowDownLeft className="h-4 w-4" />;
    case 'insurance':
      return <Shield className="h-4 w-4" />;
    case 'stake':
      return <Clock className="h-4 w-4" />;
    case 'claim':
      return <CheckCircle className="h-4 w-4" />;
  }
}

function getTypeColor(type: TransactionType) {
  switch (type) {
    case 'swap':
      return 'bg-blue-500/10 text-blue-400';
    case 'send':
      return 'bg-orange-500/10 text-orange-400';
    case 'receive':
      return 'bg-green-500/10 text-green-400';
    case 'insurance':
      return 'bg-purple-500/10 text-purple-400';
    case 'stake':
      return 'bg-cyan-500/10 text-cyan-400';
    case 'claim':
      return 'bg-yellow-500/10 text-yellow-400';
  }
}

function getStatusBadge(status: TransactionStatus) {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1 animate-pulse" />
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
  }
}

function getTransactionDescription(tx: Transaction): string {
  switch (tx.type) {
    case 'swap':
      return `Swap ${tx.tokenIn?.amount || '0'} ${tx.tokenIn?.symbol || ''} → ${tx.tokenOut?.amount || '0'} ${tx.tokenOut?.symbol || ''}`;
    case 'send':
      return `Send ${tx.tokenIn?.amount || '0'} ${tx.tokenIn?.symbol || ''} to ${formatAddress(tx.to || '')}`;
    case 'receive':
      return `Receive ${tx.tokenOut?.amount ? parseFloat(tx.tokenOut.amount).toLocaleString() : '0'} ${tx.tokenOut?.symbol || ''}`;
    case 'insurance':
      return `Buy insurance policy (${tx.tokenIn?.amount || '0'} ${tx.tokenIn?.symbol || ''})`;
    case 'stake':
      return `Stake ${tx.tokenIn?.amount ? parseFloat(tx.tokenIn.amount).toLocaleString() : '0'} ${tx.tokenIn?.symbol || ''}`;
    case 'claim':
      return `Claim ${tx.tokenOut?.amount ? parseFloat(tx.tokenOut.amount).toLocaleString() : '0'} ${tx.tokenOut?.symbol || ''}`;
    default:
      return 'Unknown transaction';
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type FilterType = 'all' | 'swap' | 'send' | 'receive' | 'insurance';

export function TransactionHistory() {
  const { isConnected } = useAccount();
  const { transactions, isLoading, error, explorerUrl } = useTransactionHistory();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Connect your wallet to view transaction history</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transaction history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {(['all', 'swap', 'send', 'receive', 'insurance'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const valueNum = tx.value ? parseFloat(tx.value) : 0;
              const gasUsedNum = tx.gasUsed ? parseFloat(tx.gasUsed) : undefined;
              return (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium">{getTransactionDescription(tx)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatTimestamp(tx.timestamp)}</span>
                        <span>•</span>
                        <span>{tx.chain}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {valueNum > 0 && (
                      <div className="text-right">
                        <p className="font-medium">{formatUSD(valueNum)}</p>
                        {gasUsedNum !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Gas: {gasUsedNum.toFixed(6)} ETH
                          </p>
                        )}
                      </div>
                    )}
                    {getStatusBadge(tx.status)}
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a 
                        href={explorerUrl(tx.hash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your transaction history will appear here once you make transactions
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
