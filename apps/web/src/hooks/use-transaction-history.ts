'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface Transaction {
  hash: string;
  type: 'swap' | 'send' | 'receive' | 'insurance' | 'stake' | 'claim';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  chain: string;
  chainId: number;
  from?: string;
  to?: string;
  tokenIn?: { symbol: string; amount: string };
  tokenOut?: { symbol: string; amount: string };
  value?: string;
  gasUsed?: string;
  blockNumber?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

const CHAIN_NAMES: Record<number, string> = {
  101: 'Solana',
};

const CHAIN_EXPLORERS: Record<number, string> = {
  101: 'https://solscan.io',
};

/**
 * Hook to fetch transaction history from blockchain
 */
export function useTransactionHistory(limit: number = 20) {
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58() || null;
  const isConnected = connected;
  const chainId = 101; // Solana chain ID
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/account/transactions?address=${address}&chainId=${chainId}&limit=${limit}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const txs = data.data.map((tx: any) => ({
            hash: tx.hash,
            type: tx.type || 'send',
            status: tx.status || 'confirmed',
            timestamp: tx.timestamp || Date.now(),
            chain: CHAIN_NAMES[chainId] || 'Unknown',
            chainId,
            from: tx.from,
            to: tx.to,
            tokenIn: tx.tokenIn,
            tokenOut: tx.tokenOut,
            value: tx.value,
            gasUsed: tx.gasUsed,
            blockNumber: tx.blockNumber,
          }));

          setTransactions(txs);
          setHasMore(txs.length === limit);
        } else {
          setTransactions([]);
          setHasMore(false);
        }
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, chainId, limit]);

  useEffect(() => {
    fetchTransactions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    refetch: fetchTransactions,
    explorerUrl: (hash: string) => `${CHAIN_EXPLORERS[chainId] || CHAIN_EXPLORERS[101]}/tx/${hash}`,
  };
}
