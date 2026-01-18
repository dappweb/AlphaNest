'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Solana 使用 SPL Token 标准，不需要 ABI

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
  chain: string;
  chainId: number;
  value?: number;
  price?: number;
  change24h?: number;
}

// Common tokens on Solana
const COMMON_TOKENS: Record<number, Array<{ address: string; symbol: string; name: string; decimals: number }>> = {
  101: [
    { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether', decimals: 6 },
  ],
};

const CHAIN_NAMES: Record<number, string> = {
  101: 'Solana',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

/**
 * Hook to fetch token balances from blockchain
 */
export function useTokenBalances() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const address = publicKey?.toBase58() || null;
  const isConnected = connected;
  const chainId = 101; // Solana chain ID
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenBalance = useCallback(
    async (token: { address: string; symbol: string; name: string; decimals: number }) => {
      if (!address) return null;

      try {
        // Read balance from API (Solana)
        const balanceResponse = await fetch(
          `${API_URL}/api/v1/blockchain/balance?address=${address}&token=${token.address}&chainId=${chainId}`
        );

        if (balanceResponse.ok) {
          const data = await balanceResponse.json();
          if (data.success && data.data.balance) {
            const balanceBigInt = BigInt(data.data.balance);
            // Solana tokens typically use 6-9 decimals
            const divisor = BigInt(10 ** token.decimals);
            const balanceFormatted = (Number(balanceBigInt) / Number(divisor)).toFixed(token.decimals);
            
            // Only return if balance > 0
            if (parseFloat(balanceFormatted) > 0) {
              return {
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                balance: balanceFormatted,
                balanceRaw: balanceBigInt,
                decimals: token.decimals,
                chain: 'Solana',
                chainId,
              };
            }
          }
        }

        return null;
      } catch (err) {
        console.error(`Error fetching balance for ${token.symbol}:`, err);
        return null;
      }
    },
    [address, chainId]
  );

  const fetchTokenPrices = useCallback(async (tokens: TokenBalance[]) => {
    if (tokens.length === 0) return {};
    
    try {
      const symbols = tokens.map((t) => t.symbol).join(',');
      const response = await fetch(
        `${API_URL}/api/v1/blockchain/prices?symbols=${symbols}&chainId=${chainId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.error('Error fetching token prices:', err);
    }
    return {};
  }, [chainId]);

  useEffect(() => {
    if (!isConnected || !address) {
      setBalances([]);
      return;
    }

    const loadBalances = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tokens = COMMON_TOKENS[chainId] || [];
        const balancePromises = tokens.map((token) => fetchTokenBalance(token));
        const results = await Promise.all(balancePromises);

        let validBalances = results
          .filter((b): b is TokenBalance => b !== null)
          .map((b) => ({ ...b }));

        // Add native token balance (SOL)
        try {
          if (publicKey) {
            const solBalance = await connection.getBalance(publicKey);
            const solBalanceFormatted = (solBalance / LAMPORTS_PER_SOL).toFixed(9);
            if (parseFloat(solBalanceFormatted) > 0) {
              const nativeToken: TokenBalance = {
                address: 'So11111111111111111111111111111111111111112', // SOL mint address
                symbol: 'SOL',
                name: 'Solana',
                balance: solBalanceFormatted,
                balanceRaw: BigInt(solBalance),
                decimals: 9,
                chain: 'Solana',
                chainId,
              };
              validBalances = [nativeToken, ...validBalances];
            }
          }
        } catch (err) {
          console.error('Error fetching SOL balance:', err);
        }

        // Fetch prices
        const prices = await fetchTokenPrices(validBalances);

        // Calculate values
        const balancesWithValues = validBalances.map((balance) => {
          const priceData = prices[balance.symbol];
          const price = priceData?.price || 0;
          const change24h = priceData?.change24h || 0;
          const value = parseFloat(balance.balance) * price;

          return {
            ...balance,
            price,
            change24h,
            value,
          };
        });

        // Sort by value descending
        balancesWithValues.sort((a, b) => (b.value || 0) - (a.value || 0));

        setBalances(balancesWithValues);
      } catch (err) {
        console.error('Error loading token balances:', err);
        setError('Failed to load token balances');
      } finally {
        setIsLoading(false);
      }
    };

    loadBalances();

    // Refresh every 30 seconds
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address, chainId, publicKey, connection, fetchTokenBalance, fetchTokenPrices]);

  return {
    balances,
    isLoading,
    error,
    refetch: () => {
      if (isConnected && address) {
        // Trigger reload
        setBalances([]);
      }
    },
  };
}
