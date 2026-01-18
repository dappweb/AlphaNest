/**
 * MultiAssetStaking 推荐返佣系统 Hooks
 * 对齐合约中的 Referral System 功能
 */

import { useCallback, useMemo } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { formatEther, parseEther, zeroAddress } from 'viem';

// Contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MULTI_ASSET_STAKING_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

// Referral ABI - 对齐 MultiAssetStaking.sol 推荐返佣功能
const REFERRAL_ABI = [
  // 绑定推荐人
  {
    name: 'bindReferrer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [],
  },
  // 领取推荐返佣
  {
    name: 'claimReferralRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // 获取推荐人
  {
    name: 'referrers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
  // 获取是否已绑定推荐人
  {
    name: 'hasReferrer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // 获取推荐信息
  {
    name: 'referralInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'referrer', type: 'address' },
      { name: 'totalReferred', type: 'uint256' },
      { name: 'totalEarned', type: 'uint256' },
      { name: 'pendingRewards', type: 'uint256' },
      { name: 'refereeStakedUSD', type: 'uint256' },
    ],
  },
  // 获取被推荐人列表
  {
    name: 'referees',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'referrer', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  // 获取推荐返佣比例
  {
    name: 'referralRates',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tier', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint16' }],
  },
  // 获取推荐等级门槛
  {
    name: 'referralTiers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tier', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint16' }],
  },
  // 推荐系统是否启用
  {
    name: 'referralEnabled',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  // 被推荐人首次质押奖励比例
  {
    name: 'inviteeBonus',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
] as const;

// 推荐等级信息
export interface ReferralTier {
  tier: number;
  minReferrals: number;
  rate: number; // 返佣比例 (basis points)
  name: string;
}

export const REFERRAL_TIERS: ReferralTier[] = [
  { tier: 0, minReferrals: 1, rate: 500, name: 'Bronze' },
  { tier: 1, minReferrals: 5, rate: 800, name: 'Silver' },
  { tier: 2, minReferrals: 10, rate: 1000, name: 'Gold' },
  { tier: 3, minReferrals: 25, rate: 1200, name: 'Platinum' },
  { tier: 4, minReferrals: 50, rate: 1500, name: 'Diamond' },
];

// 推荐信息类型
export interface ReferralInfo {
  referrer: string;
  totalReferred: bigint;
  totalEarned: bigint;
  pendingRewards: bigint;
  refereeStakedUSD: bigint;
  // 格式化后的值
  totalReferredNumber: number;
  totalEarnedFormatted: string;
  pendingRewardsFormatted: string;
  refereeStakedUSDFormatted: string;
  currentTier: ReferralTier;
  nextTier: ReferralTier | null;
  progressToNextTier: number;
}

/**
 * 获取推荐系统是否启用
 */
export function useReferralEnabled() {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERRAL_ABI,
    functionName: 'referralEnabled',
  });

  return {
    isEnabled: data ?? false,
    isLoading,
    refetch,
  };
}

/**
 * 获取用户是否已绑定推荐人
 */
export function useHasReferrer() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERRAL_ABI,
    functionName: 'hasReferrer',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    hasReferrer: data ?? false,
    isLoading,
    refetch,
  };
}

/**
 * 获取用户的推荐人地址
 */
export function useMyReferrer() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERRAL_ABI,
    functionName: 'referrers',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    referrer: data && data !== zeroAddress ? data : null,
    isLoading,
    refetch,
  };
}

/**
 * 获取用户的推荐信息（作为推荐人）
 */
export function useReferralInfo() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERRAL_ABI,
    functionName: 'referralInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const referralInfo = useMemo<ReferralInfo | null>(() => {
    if (!data) return null;

    const [referrer, totalReferred, totalEarned, pendingRewards, refereeStakedUSD] = data;
    const totalReferredNumber = Number(totalReferred);

    // 计算当前等级
    let currentTier = REFERRAL_TIERS[0];
    for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
      if (totalReferredNumber >= REFERRAL_TIERS[i].minReferrals) {
        currentTier = REFERRAL_TIERS[i];
        break;
      }
    }

    // 计算下一等级
    const nextTierIndex = REFERRAL_TIERS.findIndex(t => t.tier === currentTier.tier) + 1;
    const nextTier = nextTierIndex < REFERRAL_TIERS.length ? REFERRAL_TIERS[nextTierIndex] : null;

    // 计算升级进度
    const progressToNextTier = nextTier
      ? Math.min(100, (totalReferredNumber / nextTier.minReferrals) * 100)
      : 100;

    return {
      referrer,
      totalReferred,
      totalEarned,
      pendingRewards,
      refereeStakedUSD,
      totalReferredNumber,
      totalEarnedFormatted: formatEther(totalEarned),
      pendingRewardsFormatted: formatEther(pendingRewards),
      refereeStakedUSDFormatted: formatEther(refereeStakedUSD),
      currentTier,
      nextTier,
      progressToNextTier,
    };
  }, [data]);

  return {
    referralInfo,
    isLoading,
    refetch,
  };
}

/**
 * 获取被推荐人首次质押奖励比例
 */
export function useInviteeBonus() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERRAL_ABI,
    functionName: 'inviteeBonus',
  });

  return {
    bonusRate: data ? Number(data) / 100 : 5, // 默认 5%
    isLoading,
  };
}

/**
 * 绑定推荐人
 */
export function useBindReferrer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const bindReferrer = useCallback(
    async (referrerAddress: `0x${string}`) => {
      if (!referrerAddress || referrerAddress === zeroAddress) {
        throw new Error('Invalid referrer address');
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REFERRAL_ABI,
        functionName: 'bindReferrer',
        args: [referrerAddress],
      });
    },
    [writeContract]
  );

  return {
    bindReferrer,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * 领取推荐返佣
 */
export function useClaimReferralRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = useCallback(async () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: REFERRAL_ABI,
      functionName: 'claimReferralRewards',
    });
  }, [writeContract]);

  return {
    claimRewards,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * 组合 Hook - 完整推荐返佣功能
 */
export function useStakingReferral() {
  const { address, isConnected } = useAccount();
  const { isEnabled } = useReferralEnabled();
  const { hasReferrer } = useHasReferrer();
  const { referrer } = useMyReferrer();
  const { referralInfo, isLoading, refetch } = useReferralInfo();
  const { bonusRate } = useInviteeBonus();

  const bindReferrerAction = useBindReferrer();
  const claimRewardsAction = useClaimReferralRewards();

  // 生成推荐链接
  const referralLink = useMemo(() => {
    if (!address) return null;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://popcowdefi.pages.dev';
    return `${baseUrl}/staking?ref=${address}`;
  }, [address]);

  // 生成推荐码 (钱包地址的短格式)
  const referralCode = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return {
    // 状态
    isConnected,
    isEnabled,
    hasReferrer,
    myReferrer: referrer,
    referralInfo,
    isLoading,
    inviteeBonus: bonusRate,

    // 推荐链接/码
    referralLink,
    referralCode,
    walletAddress: address,

    // 操作
    bindReferrer: bindReferrerAction.bindReferrer,
    isBindingReferrer: bindReferrerAction.isPending,
    bindSuccess: bindReferrerAction.isSuccess,

    claimRewards: claimRewardsAction.claimRewards,
    isClaimingRewards: claimRewardsAction.isPending,
    claimSuccess: claimRewardsAction.isSuccess,

    // 刷新
    refetch,
  };
}

// 类型已在上方 export interface 导出
