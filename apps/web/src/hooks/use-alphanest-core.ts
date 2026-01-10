/**
 * AlphaNest Core Contract Hooks
 * 质押、积分、挖矿权重交互
 */

import { useCallback, useMemo } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Contract ABI (简化版，包含主要函数)
const ALPHANEST_CORE_ABI = [
  // Read functions
  {
    name: 'getStakeInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
      { name: 'pendingUnstakeAmount', type: 'uint256' },
      { name: 'unstakeUnlockTime', type: 'uint256' },
    ],
  },
  {
    name: 'getPointsInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'balance', type: 'uint256' },
      { name: 'totalEarned', type: 'uint256' },
      { name: 'totalSpent', type: 'uint256' },
    ],
  },
  {
    name: 'getMiningWeight',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalStaked',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minStakeAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'unstakeCooldown',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Write functions
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'requestUnstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'completeUnstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

// Contract address from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ALPHANEST_CORE_ADDRESS as `0x${string}`;

// ============================================
// Types
// ============================================

export interface StakeInfo {
  stakedAmount: bigint;
  pendingRewards: bigint;
  pendingUnstakeAmount: bigint;
  unstakeUnlockTime: bigint;
  stakedAmountFormatted: string;
  pendingRewardsFormatted: string;
  pendingUnstakeFormatted: string;
  canCompleteUnstake: boolean;
}

export interface PointsInfo {
  balance: bigint;
  totalEarned: bigint;
  totalSpent: bigint;
  balanceFormatted: string;
}

// ============================================
// Hooks
// ============================================

/**
 * 获取用户质押信息
 */
export function useStakeInfo() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ALPHANEST_CORE_ABI,
    functionName: 'getStakeInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  const stakeInfo: StakeInfo | null = useMemo(() => {
    if (!data) return null;

    const [stakedAmount, pendingRewards, pendingUnstakeAmount, unstakeUnlockTime] = data;
    const now = BigInt(Math.floor(Date.now() / 1000));

    return {
      stakedAmount,
      pendingRewards,
      pendingUnstakeAmount,
      unstakeUnlockTime,
      stakedAmountFormatted: formatEther(stakedAmount),
      pendingRewardsFormatted: formatEther(pendingRewards),
      pendingUnstakeFormatted: formatEther(pendingUnstakeAmount),
      canCompleteUnstake: pendingUnstakeAmount > 0n && now >= unstakeUnlockTime,
    };
  }, [data]);

  return {
    stakeInfo,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 获取用户积分信息
 */
export function usePointsInfo() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ALPHANEST_CORE_ABI,
    functionName: 'getPointsInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  const pointsInfo: PointsInfo | null = useMemo(() => {
    if (!data) return null;

    const [balance, totalEarned, totalSpent] = data;

    return {
      balance,
      totalEarned,
      totalSpent,
      balanceFormatted: balance.toString(),
    };
  }, [data]);

  return {
    pointsInfo,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 获取用户挖矿权重
 */
export function useMiningWeight() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ALPHANEST_CORE_ABI,
    functionName: 'getMiningWeight',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  return {
    weight: data ?? 0n,
    weightFormatted: data ? formatEther(data) : '0',
    isLoading,
    error,
  };
}

/**
 * 获取全局质押统计
 */
export function useGlobalStakeStats() {
  const { data: totalStaked, isLoading: loadingTotal } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ALPHANEST_CORE_ABI,
    functionName: 'totalStaked',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  const { data: minStake, isLoading: loadingMin } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ALPHANEST_CORE_ABI,
    functionName: 'minStakeAmount',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  const { data: cooldown, isLoading: loadingCooldown } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ALPHANEST_CORE_ABI,
    functionName: 'unstakeCooldown',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  return {
    totalStaked: totalStaked ?? 0n,
    totalStakedFormatted: totalStaked ? formatEther(totalStaked) : '0',
    minStakeAmount: minStake ?? 0n,
    minStakeFormatted: minStake ? formatEther(minStake) : '0',
    unstakeCooldownDays: cooldown ? Number(cooldown) / 86400 : 7,
    isLoading: loadingTotal || loadingMin || loadingCooldown,
  };
}

/**
 * 质押操作
 */
export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = useCallback(
    async (amount: string) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      const amountWei = parseEther(amount);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ALPHANEST_CORE_ABI,
        functionName: 'stake',
        args: [amountWei],
      });
    },
    [writeContract]
  );

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 请求解除质押
 */
export function useRequestUnstake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestUnstake = useCallback(
    async (amount: string) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      const amountWei = parseEther(amount);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ALPHANEST_CORE_ABI,
        functionName: 'requestUnstake',
        args: [amountWei],
      });
    },
    [writeContract]
  );

  return {
    requestUnstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 完成解除质押
 */
export function useCompleteUnstake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const completeUnstake = useCallback(async () => {
    if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ALPHANEST_CORE_ABI,
      functionName: 'completeUnstake',
      args: [],
    });
  }, [writeContract]);

  return {
    completeUnstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 领取质押奖励
 */
export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = useCallback(async () => {
    if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ALPHANEST_CORE_ABI,
      functionName: 'claimRewards',
      args: [],
    });
  }, [writeContract]);

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 组合 Hook - 完整质押管理
 */
export function useAlphaNestStaking() {
  const { address } = useAccount();
  const { stakeInfo, isLoading: loadingStake, refetch: refetchStake } = useStakeInfo();
  const { pointsInfo, isLoading: loadingPoints, refetch: refetchPoints } = usePointsInfo();
  const { weight, weightFormatted, isLoading: loadingWeight } = useMiningWeight();
  const globalStats = useGlobalStakeStats();

  const stakeAction = useStake();
  const unstakeAction = useRequestUnstake();
  const completeAction = useCompleteUnstake();
  const claimAction = useClaimRewards();

  const refetchAll = useCallback(() => {
    refetchStake();
    refetchPoints();
  }, [refetchStake, refetchPoints]);

  return {
    // User state
    isConnected: !!address,
    stakeInfo,
    pointsInfo,
    miningWeight: weight,
    miningWeightFormatted: weightFormatted,

    // Global state
    globalStats,

    // Loading states
    isLoading: loadingStake || loadingPoints || loadingWeight,

    // Actions
    stake: stakeAction,
    requestUnstake: unstakeAction,
    completeUnstake: completeAction,
    claimRewards: claimAction,

    // Refresh
    refetch: refetchAll,
  };
}
