/**
 * MultiAssetStaking Contract Hooks
 * 对齐 contracts/src/MultiAssetStaking.sol
 */

import { useCallback, useMemo } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';

// Contract ABI - 对齐 MultiAssetStaking.sol
const MULTI_ASSET_STAKING_ABI = [
  // 质押 ETH
  {
    name: 'stakeETH',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'lockPeriod', type: 'uint8' }],
    outputs: [],
  },
  // 质押 ERC20
  {
    name: 'stakeToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'lockPeriod', type: 'uint8' },
    ],
    outputs: [],
  },
  // 解除质押
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    outputs: [],
  },
  // 领取奖励
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    outputs: [],
  },
  // 获取质押信息
  {
    name: 'getStakeInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenAddress', type: 'address' },
    ],
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'valueUSD', type: 'uint256' },
      { name: 'lockPeriod', type: 'uint8' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'rewardMultiplier', type: 'uint256' },
      { name: 'earlyBirdBonus', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
    ],
  },
  // 获取代币配置
  {
    name: 'getTokenConfig',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'decimals', type: 'uint8' },
      { name: 'baseAPY', type: 'uint16' },
      { name: 'rewardMultiplier', type: 'uint8' },
      { name: 'minStakeAmount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'totalStaked', type: 'uint256' },
      { name: 'totalStakers', type: 'uint256' },
    ],
  },
  // 获取支持的代币列表
  {
    name: 'getSupportedTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  // 获取用户总 USD 价值
  {
    name: 'getUserTotalStakedUSD',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'total', type: 'uint256' }],
  },
  // 获取全局统计
  {
    name: 'getGlobalStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalStakedUSD', type: 'uint256' },
      { name: 'totalStakers', type: 'uint256' },
      { name: 'rewardPerSecond', type: 'uint256' },
      { name: 'supportedTokenCount', type: 'uint256' },
    ],
  },
  // 获取锁定期奖励倍数
  {
    name: 'getRewardMultiplier',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'lockPeriod', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // 获取锁定期时长
  {
    name: 'getLockDuration',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'lockPeriod', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // 获取早鸟奖励
  {
    name: 'getEarlyBirdBonus',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MULTI_ASSET_STAKING_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

// ETH 地址标识
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// 锁定期枚举
export enum LockPeriod {
  Flexible = 0,           // 灵活
  ThirtyDays = 1,         // 30天
  NinetyDays = 2,         // 90天
  OneEightyDays = 3,      // 180天
  ThreeSixtyFiveDays = 4, // 365天
}

export const LOCK_PERIOD_LABELS = {
  [LockPeriod.Flexible]: 'Flexible (1x)',
  [LockPeriod.ThirtyDays]: '30 Days (1.5x)',
  [LockPeriod.NinetyDays]: '90 Days (2x)',
  [LockPeriod.OneEightyDays]: '180 Days (3x)',
  [LockPeriod.ThreeSixtyFiveDays]: '365 Days (5x)',
};

// Types
export interface StakeInfo {
  stakedAmount: bigint;
  valueUSD: bigint;
  lockPeriod: LockPeriod;
  unlockTime: bigint;
  rewardMultiplier: bigint;
  earlyBirdBonus: bigint;
  pendingRewards: bigint;
  stakedAmountFormatted: string;
  valueUSDFormatted: string;
  pendingRewardsFormatted: string;
  isLocked: boolean;
}

export interface TokenConfig {
  name: string;
  decimals: number;
  baseAPY: number;
  rewardMultiplier: number;
  minStakeAmount: bigint;
  isActive: boolean;
  totalStaked: bigint;
  totalStakers: bigint;
}

export interface GlobalStats {
  totalStakedUSD: bigint;
  totalStakers: bigint;
  rewardPerSecond: bigint;
  supportedTokenCount: bigint;
  totalStakedUSDFormatted: string;
}

// ============================================
// Hooks
// ============================================

/**
 * 获取用户质押信息
 */
export function useStakeInfo(tokenAddress: `0x${string}` = ETH_ADDRESS) {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MULTI_ASSET_STAKING_ABI,
    functionName: 'getStakeInfo',
    args: address ? [address, tokenAddress] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  const stakeInfo: StakeInfo | null = useMemo(() => {
    if (!data) return null;

    const [stakedAmount, valueUSD, lockPeriod, unlockTime, rewardMultiplier, earlyBirdBonus, pendingRewards] = data;
    const now = BigInt(Math.floor(Date.now() / 1000));

    return {
      stakedAmount,
      valueUSD,
      lockPeriod: lockPeriod as LockPeriod,
      unlockTime,
      rewardMultiplier,
      earlyBirdBonus,
      pendingRewards,
      stakedAmountFormatted: formatEther(stakedAmount),
      valueUSDFormatted: formatUnits(valueUSD, 6),
      pendingRewardsFormatted: formatEther(pendingRewards),
      isLocked: lockPeriod !== LockPeriod.Flexible && now < unlockTime,
    };
  }, [data]);

  return { stakeInfo, isLoading, error, refetch };
}

/**
 * 获取代币配置
 */
export function useTokenConfig(tokenAddress: `0x${string}` = ETH_ADDRESS) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MULTI_ASSET_STAKING_ABI,
    functionName: 'getTokenConfig',
    args: [tokenAddress],
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  const tokenConfig: TokenConfig | null = useMemo(() => {
    if (!data) return null;

    const [name, decimals, baseAPY, rewardMultiplier, minStakeAmount, isActive, totalStaked, totalStakers] = data;

    return {
      name,
      decimals,
      baseAPY: baseAPY / 100, // 转换为百分比
      rewardMultiplier,
      minStakeAmount,
      isActive,
      totalStaked,
      totalStakers,
    };
  }, [data]);

  return { tokenConfig, isLoading, error, refetch };
}

/**
 * 获取支持的代币列表
 */
export function useSupportedTokens() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MULTI_ASSET_STAKING_ABI,
    functionName: 'getSupportedTokens',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  return {
    tokens: (data || []) as `0x${string}`[],
    isLoading,
    error,
    refetch,
  };
}

/**
 * 获取全局统计
 */
export function useGlobalStats() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MULTI_ASSET_STAKING_ABI,
    functionName: 'getGlobalStats',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  const stats: GlobalStats | null = useMemo(() => {
    if (!data) return null;

    const [totalStakedUSD, totalStakers, rewardPerSecond, supportedTokenCount] = data;

    return {
      totalStakedUSD,
      totalStakers,
      rewardPerSecond,
      supportedTokenCount,
      totalStakedUSDFormatted: formatUnits(totalStakedUSD, 6),
    };
  }, [data]);

  return { stats, isLoading, error, refetch };
}

/**
 * 获取早鸟奖励
 */
export function useEarlyBirdBonus() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MULTI_ASSET_STAKING_ABI,
    functionName: 'getEarlyBirdBonus',
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  return {
    bonus: data ? Number(data) : 0,
    isLoading,
  };
}

/**
 * 质押 ETH
 */
export function useStakeETH() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stakeETH = useCallback(
    async (amount: string, lockPeriod: LockPeriod) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      const amountWei = parseEther(amount);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MULTI_ASSET_STAKING_ABI,
        functionName: 'stakeETH',
        args: [lockPeriod],
        value: amountWei,
      });
    },
    [writeContract]
  );

  return {
    stakeETH,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 质押 ERC20
 */
export function useStakeToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stakeToken = useCallback(
    async (tokenAddress: `0x${string}`, amount: string, decimals: number, lockPeriod: LockPeriod) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      const amountWei = parseUnits(amount, decimals);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MULTI_ASSET_STAKING_ABI,
        functionName: 'stakeToken',
        args: [tokenAddress, amountWei, lockPeriod],
      });
    },
    [writeContract]
  );

  return {
    stakeToken,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 解除质押
 */
export function useUnstake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = useCallback(
    async (tokenAddress: `0x${string}`) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MULTI_ASSET_STAKING_ABI,
        functionName: 'unstake',
        args: [tokenAddress],
      });
    },
    [writeContract]
  );

  return {
    unstake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * 领取奖励
 */
export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = useCallback(
    async (tokenAddress: `0x${string}`) => {
      if (!CONTRACT_ADDRESS) throw new Error('Contract not configured');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MULTI_ASSET_STAKING_ABI,
        functionName: 'claimRewards',
        args: [tokenAddress],
      });
    },
    [writeContract]
  );

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
 * 组合 Hook - 完整多资产质押管理
 */
export function useMultiAssetStaking(tokenAddress: `0x${string}` = ETH_ADDRESS) {
  const { address } = useAccount();
  const { stakeInfo, isLoading: loadingStake, refetch: refetchStake } = useStakeInfo(tokenAddress);
  const { tokenConfig, isLoading: loadingConfig, refetch: refetchConfig } = useTokenConfig(tokenAddress);
  const { stats: globalStats, isLoading: loadingGlobal, refetch: refetchGlobal } = useGlobalStats();
  const { tokens: supportedTokens, isLoading: loadingTokens } = useSupportedTokens();
  const { bonus: earlyBirdBonus, isLoading: loadingBonus } = useEarlyBirdBonus();

  const stakeETHAction = useStakeETH();
  const stakeTokenAction = useStakeToken();
  const unstakeAction = useUnstake();
  const claimAction = useClaimRewards();

  const refetchAll = useCallback(() => {
    refetchStake();
    refetchConfig();
    refetchGlobal();
  }, [refetchStake, refetchConfig, refetchGlobal]);

  return {
    // User state
    isConnected: !!address,
    stakeInfo,
    tokenConfig,

    // Global state
    globalStats,
    supportedTokens,
    earlyBirdBonus,

    // Loading states
    isLoading: loadingStake || loadingConfig || loadingGlobal || loadingTokens || loadingBonus,

    // Actions
    stakeETH: stakeETHAction,
    stakeToken: stakeTokenAction,
    unstake: unstakeAction,
    claimRewards: claimAction,

    // Refresh
    refetch: refetchAll,
  };
}

// Export ETH address constant
export { ETH_ADDRESS };
