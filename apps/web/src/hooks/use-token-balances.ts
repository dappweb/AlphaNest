'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useChainId, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

// ERC20 ABI
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

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

// Common tokens by chain
const COMMON_TOKENS: Record<number, Array<{ address: string; symbol: string; name: string; decimals: number }>> = {
  1: [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6 },
    { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', symbol: 'PEPE', name: 'Pepe', decimals: 18 },
  ],
  8453: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', symbol: 'DEGEN', name: 'Degen', decimals: 18 },
    { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', symbol: 'BRETT', name: 'Brett', decimals: 18 },
  ],
  11155111: [
    { address: '0xceCC6D1dA322b6AC060D3998CA58e077CB679F79', symbol: 'USDC', name: 'Mock USDC', decimals: 6 },
  ],
  56: [
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  ],
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  56: 'BNB Chain',
  11155111: 'Sepolia',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

/**
 * Hook to fetch token balances from blockchain
 */
export function useTokenBalances() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: nativeBalance } = useBalance({ address });
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenBalance = useCallback(
    async (token: { address: string; symbol: string; name: string; decimals: number }) => {
      if (!address) return null;

      try {
        // Read balance from API
        const balanceResponse = await fetch(
          `${API_URL}/api/v1/blockchain/balance?address=${address}&token=${token.address}&chainId=${chainId}`
        );

        if (balanceResponse.ok) {
          const data = await balanceResponse.json();
          if (data.success && data.data.balance) {
            const balanceBigInt = BigInt(data.data.balance);
            const balanceFormatted = formatUnits(balanceBigInt, token.decimals);
            
            // Only return if balance > 0
            if (parseFloat(balanceFormatted) > 0) {
              return {
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                balance: balanceFormatted,
                balanceRaw: balanceBigInt,
                decimals: token.decimals,
                chain: CHAIN_NAMES[chainId] || 'Unknown',
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

        // Add native token balance (ETH/BNB)
        if (nativeBalance && parseFloat(nativeBalance.formatted) > 0) {
          const nativeToken: TokenBalance = {
            address: '0x0000000000000000000000000000000000000000',
            symbol: nativeBalance.symbol,
            name: CHAIN_NAMES[chainId] || 'Native',
            balance: nativeBalance.formatted,
            balanceRaw: nativeBalance.value,
            decimals: 18,
            chain: CHAIN_NAMES[chainId] || 'Unknown',
            chainId,
          };
          validBalances = [nativeToken, ...validBalances];
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
  }, [isConnected, address, chainId, nativeBalance, fetchTokenBalance, fetchTokenPrices]);

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
