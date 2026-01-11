'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract addresses (will be updated after deployment)
const ALPHAGUARD_ADDRESS = process.env.NEXT_PUBLIC_ALPHAGUARD_ADDRESS as `0x${string}` || '0xCbcE6832F5E59F90c24bFb57Fb6f1Bc8B4232f03';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` || '0xceCC6D1dA322b6AC060D3998CA58e077CB679F79';

// ABIs
const ALPHAGUARD_ABI = [
  {
    name: 'purchasePolicy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'position', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'policyId', type: 'uint256' }],
  },
  {
    name: 'claimPayout',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'policyId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getPoolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'totalRugBets', type: 'uint256' },
      { name: 'totalSafeBets', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'outcome', type: 'uint8' },
    ],
  },
  {
    name: 'getPoolOdds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      { name: 'rugOdds', type: 'uint256' },
      { name: 'safeOdds', type: 'uint256' },
    ],
  },
  {
    name: 'calculatePayout',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'policyId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUserPolicies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'policies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'policyId', type: 'uint256' }],
    outputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'holder', type: 'address' },
      { name: 'position', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
  },
  {
    name: 'pools',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'totalRugBets', type: 'uint256' },
      { name: 'totalSafeBets', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'resolvedAt', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'outcome', type: 'uint8' },
      { name: 'minBet', type: 'uint256' },
      { name: 'maxBet', type: 'uint256' },
    ],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Position enum
export enum Position {
  RUG = 0,
  SAFE = 1,
}

// Pool status enum
export enum PoolStatus {
  ACTIVE = 0,
  RESOLVED = 1,
  CANCELLED = 2,
}

// Outcome enum
export enum Outcome {
  PENDING = 0,
  RUGGED = 1,
  SAFE = 2,
  CANCELLED = 3,
}

export interface PoolInfo {
  token: string;
  totalRugBets: bigint;
  totalSafeBets: bigint;
  expiresAt: bigint;
  status: PoolStatus;
  outcome: Outcome;
  minBet: bigint;
  maxBet: bigint;
}

export interface PolicyInfo {
  poolId: bigint;
  holder: string;
  position: Position;
  amount: bigint;
  createdAt: bigint;
  claimed: boolean;
}

/**
 * Hook for purchasing insurance policy
 */
export function usePurchasePolicy() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);

  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: purchase, data: purchaseHash } = useWriteContract();

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isPurchaseLoading, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  // Check allowance
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ALPHAGUARD_ADDRESS] : undefined,
  });

  const purchasePolicy = useCallback(
    async (poolId: number, position: Position, amountUsdc: string) => {
      if (!address) throw new Error('Wallet not connected');

      const amount = parseUnits(amountUsdc, 6); // USDC has 6 decimals

      // Check if approval needed
      if (!allowance || allowance < amount) {
        setIsApproving(true);
        approve({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ALPHAGUARD_ADDRESS, amount],
        });
        return;
      }

      // Purchase policy
      purchase({
        address: ALPHAGUARD_ADDRESS,
        abi: ALPHAGUARD_ABI,
        functionName: 'purchasePolicy',
        args: [BigInt(poolId), position, amount],
      });
    },
    [address, allowance, approve, purchase]
  );

  return {
    purchasePolicy,
    isApproving: isApproving && isApproveLoading,
    isPurchasing: isPurchaseLoading,
    isApproveSuccess,
    isPurchaseSuccess,
    approveHash,
    purchaseHash,
  };
}

/**
 * Hook for claiming insurance payout
 */
export function useClaimPayout() {
  const { writeContract, data: hash } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimPayout = useCallback(
    (policyId: number) => {
      writeContract({
        address: ALPHAGUARD_ADDRESS,
        abi: ALPHAGUARD_ABI,
        functionName: 'claimPayout',
        args: [BigInt(policyId)],
      });
    },
    [writeContract]
  );

  return { claimPayout, isLoading, isSuccess, hash };
}

/**
 * Hook for reading pool information
 */
export function usePoolInfo(poolId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: ALPHAGUARD_ADDRESS,
    abi: ALPHAGUARD_ABI,
    functionName: 'pools',
    args: [BigInt(poolId)],
  });

  const poolInfo: PoolInfo | null = data
    ? {
        token: data[0],
        totalRugBets: data[1],
        totalSafeBets: data[2],
        expiresAt: data[4],
        status: data[6] as PoolStatus,
        outcome: data[7] as Outcome,
        minBet: data[8],
        maxBet: data[9],
      }
    : null;

  return { poolInfo, isLoading, refetch };
}

/**
 * Hook for reading pool odds
 */
export function usePoolOdds(poolId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: ALPHAGUARD_ADDRESS,
    abi: ALPHAGUARD_ABI,
    functionName: 'getPoolOdds',
    args: [BigInt(poolId)],
  });

  return {
    rugOdds: data ? Number(data[0]) / 10000 : null,
    safeOdds: data ? Number(data[1]) / 10000 : null,
    isLoading,
    refetch,
  };
}

/**
 * Hook for reading user policies
 */
export function useUserPolicies() {
  const { address } = useAccount();

  const { data: policyIds, isLoading, refetch } = useReadContract({
    address: ALPHAGUARD_ADDRESS,
    abi: ALPHAGUARD_ABI,
    functionName: 'getUserPolicies',
    args: address ? [address] : undefined,
  });

  return { policyIds: policyIds || [], isLoading, refetch };
}

/**
 * Hook for reading policy details
 */
export function usePolicyInfo(policyId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: ALPHAGUARD_ADDRESS,
    abi: ALPHAGUARD_ABI,
    functionName: 'policies',
    args: [BigInt(policyId)],
  });

  const policyInfo: PolicyInfo | null = data
    ? {
        poolId: data[0],
        holder: data[1],
        position: data[2] as Position,
        amount: data[3],
        createdAt: data[4],
        claimed: data[5],
      }
    : null;

  return { policyInfo, isLoading, refetch };
}

/**
 * Hook for calculating potential payout
 */
export function useCalculatePayout(policyId: number) {
  const { data, isLoading } = useReadContract({
    address: ALPHAGUARD_ADDRESS,
    abi: ALPHAGUARD_ABI,
    functionName: 'calculatePayout',
    args: [BigInt(policyId)],
  });

  return {
    payout: data ? formatUnits(data, 6) : null,
    isLoading,
  };
}

/**
 * Hook for USDC balance
 */
export function useUsdcBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  return {
    balance: data ? formatUnits(data, 6) : '0',
    balanceRaw: data || BigInt(0),
    isLoading,
    refetch,
  };
}

/**
 * Hook for fetching active insurance pools from contract
 * Note: Since contract doesn't have a poolCount, we'll fetch from API or use a range
 */
export function useActivePools(maxPoolId: number = 10) {
  const [pools, setPools] = useState<Array<{ poolId: number; poolInfo: PoolInfo; odds: { rug: number; safe: number } }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      setIsLoading(true);
      const activePools: typeof pools = [];

      for (let poolId = 1; poolId <= maxPoolId; poolId++) {
        try {
          // Fetch pool info and odds in parallel
          const [poolInfoResult, oddsResult] = await Promise.all([
            fetch(`/api/insurance/pools/${poolId}`).catch(() => null),
            fetch(`/api/insurance/pools/${poolId}/odds`).catch(() => null),
          ]);

          // If API fails, try reading from contract directly
          // For now, we'll use a simpler approach: fetch from backend API
        } catch (error) {
          // Skip failed pools
        }
      }

      setPools(activePools);
      setIsLoading(false);
    };

    fetchPools();
  }, [maxPoolId]);

  return { pools, isLoading };
}
