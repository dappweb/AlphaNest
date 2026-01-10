/**
 * Verify-to-Earn Hooks
 * 验证即挖矿功能
 */

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================
// Types
// ============================================

export type SupportedChain = 'ethereum' | 'base' | 'bnb' | 'solana';

export interface HoldingVerification {
  id: string;
  chain: SupportedChain;
  tokenAddress: string;
  tokenSymbol: string;
  balance: string;
  balanceUsd: string;
  verifiedAt: number;
  expiresAt: number;
  pointsEarned: number;
}

export interface VerificationRequest {
  chain: SupportedChain;
  tokenAddress: string;
  walletAddress: string;
  signature: string;
  message: string;
}

export interface UserVerificationStats {
  totalVerifications: number;
  totalPointsEarned: number;
  activeVerifications: number;
  chainBreakdown: Record<SupportedChain, number>;
}

// ============================================
// API Functions
// ============================================

async function fetchUserVerifications(): Promise<HoldingVerification[]> {
  const response = await fetch(`${API_BASE}/api/v1/user/verifications`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch verifications');
  const data = await response.json();
  return data.data;
}

async function submitVerification(
  request: VerificationRequest
): Promise<{ verified: boolean; pointsEarned: number; verification: HoldingVerification }> {
  const response = await fetch(`${API_BASE}/api/v1/user/verify-holding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Verification failed');
  }
  const data = await response.json();
  return data.data;
}

async function fetchVerificationStats(): Promise<UserVerificationStats> {
  const response = await fetch(`${API_BASE}/api/v1/user/verification-stats`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  const data = await response.json();
  return data.data;
}

async function fetchEligibleTokens(chain: SupportedChain): Promise<
  Array<{
    address: string;
    symbol: string;
    name: string;
    pointsPerVerify: number;
    minBalance: string;
  }>
> {
  const response = await fetch(`${API_BASE}/api/v1/tokens/eligible?chain=${chain}`);
  if (!response.ok) throw new Error('Failed to fetch eligible tokens');
  const data = await response.json();
  return data.data;
}

// ============================================
// Hooks
// ============================================

/**
 * 获取用户验证历史
 */
export function useUserVerifications() {
  return useQuery({
    queryKey: ['user-verifications'],
    queryFn: fetchUserVerifications,
    staleTime: 60 * 1000,
  });
}

/**
 * 获取用户验证统计
 */
export function useVerificationStats() {
  return useQuery({
    queryKey: ['verification-stats'],
    queryFn: fetchVerificationStats,
    staleTime: 60 * 1000,
  });
}

/**
 * 获取可验证的代币列表
 */
export function useEligibleTokens(chain: SupportedChain) {
  return useQuery({
    queryKey: ['eligible-tokens', chain],
    queryFn: () => fetchEligibleTokens(chain),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * EVM 链验证
 */
export function useEvmVerification() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();

  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (chain: 'ethereum' | 'base' | 'bnb', tokenAddress: string) => {
      if (!address) throw new Error('Wallet not connected');

      setIsVerifying(true);
      setError(null);

      try {
        // Create verification message
        const timestamp = Date.now();
        const message = `AlphaNest Verification\n\nChain: ${chain}\nToken: ${tokenAddress}\nWallet: ${address}\nTimestamp: ${timestamp}`;

        // Sign the message
        const signature = await signMessageAsync({ message });

        // Submit verification
        const result = await submitVerification({
          chain,
          tokenAddress,
          walletAddress: address,
          signature,
          message,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['user-verifications'] });
        queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
        queryClient.invalidateQueries({ queryKey: ['points-info'] });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsVerifying(false);
      }
    },
    [address, signMessageAsync, queryClient]
  );

  return {
    verify,
    isVerifying,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Solana 链验证
 */
export function useSolanaVerification() {
  const { publicKey, signMessage } = useWallet();
  const queryClient = useQueryClient();

  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (tokenAddress: string) => {
      if (!publicKey || !signMessage) throw new Error('Wallet not connected');

      setIsVerifying(true);
      setError(null);

      try {
        const walletAddress = publicKey.toBase58();
        const timestamp = Date.now();
        const message = `AlphaNest Verification\n\nChain: solana\nToken: ${tokenAddress}\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;

        // Sign the message
        const encodedMessage = new TextEncoder().encode(message);
        const signatureBytes = await signMessage(encodedMessage);
        const signature = Buffer.from(signatureBytes).toString('base64');

        // Submit verification
        const result = await submitVerification({
          chain: 'solana',
          tokenAddress,
          walletAddress,
          signature,
          message,
        });

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['user-verifications'] });
        queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
        queryClient.invalidateQueries({ queryKey: ['points-info'] });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsVerifying(false);
      }
    },
    [publicKey, signMessage, queryClient]
  );

  return {
    verify,
    isVerifying,
    error,
    clearError: () => setError(null),
  };
}

/**
 * 组合 Hook - 完整验证功能
 */
export function useVerifyToEarn() {
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaPublicKey } = useWallet();

  const verifications = useUserVerifications();
  const stats = useVerificationStats();
  const evmVerify = useEvmVerification();
  const solanaVerify = useSolanaVerification();

  // Get active verifications (not expired)
  const activeVerifications = verifications.data?.filter(
    (v) => v.expiresAt > Date.now() / 1000
  );

  // Check if a token is already verified
  const isTokenVerified = useCallback(
    (chain: SupportedChain, tokenAddress: string) => {
      return activeVerifications?.some(
        (v) =>
          v.chain === chain &&
          v.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      );
    },
    [activeVerifications]
  );

  return {
    // Wallet states
    evmConnected: !!evmAddress,
    solanaConnected: !!solanaPublicKey,

    // Data
    verifications: verifications.data || [],
    activeVerifications: activeVerifications || [],
    stats: stats.data,

    // Loading states
    isLoading: verifications.isLoading || stats.isLoading,
    isVerifying: evmVerify.isVerifying || solanaVerify.isVerifying,

    // Error states
    error: evmVerify.error || solanaVerify.error,

    // Actions
    verifyEvm: evmVerify.verify,
    verifySolana: solanaVerify.verify,

    // Utilities
    isTokenVerified,

    // Refresh
    refetch: () => {
      verifications.refetch();
      stats.refetch();
    },
  };
}

// ============================================
// Utility Functions
// ============================================

export function getChainIcon(chain: SupportedChain): string {
  const icons: Record<SupportedChain, string> = {
    ethereum: '/chains/ethereum.svg',
    base: '/chains/base.svg',
    bnb: '/chains/bnb.svg',
    solana: '/chains/solana.svg',
  };
  return icons[chain];
}

export function getChainName(chain: SupportedChain): string {
  const names: Record<SupportedChain, string> = {
    ethereum: 'Ethereum',
    base: 'Base',
    bnb: 'BNB Chain',
    solana: 'Solana',
  };
  return names[chain];
}

export function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now() / 1000;
  const remaining = expiresAt - now;

  if (remaining <= 0) return 'Expired';

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}
