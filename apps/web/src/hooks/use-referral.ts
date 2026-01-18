/**
 * Referral System Hook
 * 推荐系统 - 邀请好友获得奖励
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Safe Solana wallet hook - returns null if provider not available
function useSolanaWalletSafe() {
  try {
    // Dynamic import to avoid SSR issues
    const { useWallet } = require('@solana/wallet-adapter-react');
    return useWallet();
  } catch {
    return { publicKey: null, connected: false };
  }
}

// 默认推荐人（管理员地址）- 新用户必须有推荐人
export const DEFAULT_REFERRER_EVM = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';
export const DEFAULT_REFERRER_SOLANA = process.env.NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS || 'AdminSolanaWalletAddressHere';

// 推荐系统配置
export const REFERRAL_CONFIG = {
  // 奖励比例 (基于被邀请人质押/保险的金额)
  rewardRates: {
    tier1: { minReferrals: 1, rate: 5 },   // 1-4人: 5%
    tier2: { minReferrals: 5, rate: 8 },   // 5-9人: 8%
    tier3: { minReferrals: 10, rate: 10 }, // 10-24人: 10%
    tier4: { minReferrals: 25, rate: 12 }, // 25-49人: 12%
    tier5: { minReferrals: 50, rate: 15 }, // 50+人: 15%
  },
  // 被邀请人奖励
  inviteeBonus: 5, // 被邀请人获得 5% 首次质押奖励
  // 最小领取金额
  minClaimAmount: 10, // $10 USDC
  // 默认推荐人（管理员）
  defaultReferrer: {
    evm: DEFAULT_REFERRER_EVM,
    solana: DEFAULT_REFERRER_SOLANA,
  },
  // 新用户必须有推荐人
  requireReferrer: true,
};

// 推荐等级
export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export const TIER_CONFIG: Record<ReferralTier, { name: string; icon: string; minReferrals: number; rate: number; color: string }> = {
  bronze: { name: 'Bronze', icon: '🥉', minReferrals: 1, rate: 5, color: 'text-orange-400' },
  silver: { name: 'Silver', icon: '🥈', minReferrals: 5, rate: 8, color: 'text-gray-400' },
  gold: { name: 'Gold', icon: '🥇', minReferrals: 10, rate: 10, color: 'text-yellow-500' },
  platinum: { name: 'Platinum', icon: '💎', minReferrals: 25, rate: 12, color: 'text-blue-400' },
  diamond: { name: 'Diamond', icon: '👑', minReferrals: 50, rate: 15, color: 'text-purple-500' },
};

// 类型定义
export interface ReferralStats {
  totalReferred: number;
  activeStakers: number;
  totalEarned: number;
  pendingRewards: number;
  currentTier: ReferralTier;
  currentRate: number;
  nextTier: ReferralTier | null;
  referralsToNextTier: number;
}

export interface ReferralRecord {
  id: string;
  address: string;
  chain: 'bsc' | 'solana';
  joinedAt: Date;
  totalStaked: number;
  totalInsured: number;
  rewardGenerated: number;
  status: 'pending' | 'active' | 'inactive';
}

export interface ReferralCode {
  code: string;
  link: string;
  createdAt: Date;
  usageCount: number;
}

// 生成推荐码
function generateReferralCode(address: string): string {
  const prefix = 'ALPHA';
  const hash = address.slice(2, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${prefix}-${hash}${random}`;
}

// 获取推荐链接
function getReferralLink(code: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.popcow.xyz';
  return `${baseUrl}?ref=${code}`;
}

// 计算当前等级
function calculateTier(referralCount: number): ReferralTier {
  if (referralCount >= 50) return 'diamond';
  if (referralCount >= 25) return 'platinum';
  if (referralCount >= 10) return 'gold';
  if (referralCount >= 5) return 'silver';
  return 'bronze';
}

// 计算当前奖励比例
function calculateRewardRate(referralCount: number): number {
  const tier = calculateTier(referralCount);
  return TIER_CONFIG[tier].rate;
}

// 获取下一等级
function getNextTier(currentTier: ReferralTier): ReferralTier | null {
  const tiers: ReferralTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1];
  }
  return null;
}

// 计算到下一等级需要的推荐数
function getReferralsToNextTier(currentCount: number, nextTier: ReferralTier | null): number {
  if (!nextTier) return 0;
  return TIER_CONFIG[nextTier].minReferrals - currentCount;
}

/**
 * 推荐码管理 Hook
 */
export function useReferralCode() {
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const address = evmAddress || solanaPublicKey?.toBase58();

  useEffect(() => {
    if (!address) {
      setReferralCode(null);
      return;
    }

    // 从 localStorage 获取或生成推荐码
    const storageKey = `popcow-referral-${address}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReferralCode({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } catch {
        // 生成新的
        const newCode = generateReferralCode(address);
        const newReferral: ReferralCode = {
          code: newCode,
          link: getReferralLink(newCode),
          createdAt: new Date(),
          usageCount: 0,
        };
        localStorage.setItem(storageKey, JSON.stringify(newReferral));
        setReferralCode(newReferral);
      }
    } else {
      const newCode = generateReferralCode(address);
      const newReferral: ReferralCode = {
        code: newCode,
        link: getReferralLink(newCode),
        createdAt: new Date(),
        usageCount: 0,
      };
      localStorage.setItem(storageKey, JSON.stringify(newReferral));
      setReferralCode(newReferral);
    }
  }, [address]);

  const copyCode = useCallback(async () => {
    if (!referralCode) return false;
    try {
      await navigator.clipboard.writeText(referralCode.code);
      return true;
    } catch {
      return false;
    }
  }, [referralCode]);

  const copyLink = useCallback(async () => {
    if (!referralCode) return false;
    try {
      await navigator.clipboard.writeText(referralCode.link);
      return true;
    } catch {
      return false;
    }
  }, [referralCode]);

  const shareToTwitter = useCallback(() => {
    if (!referralCode) return;
    const text = encodeURIComponent(
      `🦙 I'm earning passive income with PopCowDefi!\n\n` +
      `✅ Stake Meme tokens (Four.meme & pump.fun)\n` +
      `✅ Get insurance protection\n` +
      `✅ Earn up to 25% APY\n\n` +
      `Join with my code and get 5% bonus! 🎁\n\n` +
      `${referralCode.link}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [referralCode]);

  const shareToTelegram = useCallback(() => {
    if (!referralCode) return;
    const text = encodeURIComponent(
      `🦙 PopCowDefi - Meme Token Staking & Insurance\n\n` +
      `Join with my code: ${referralCode.code}\n` +
      `Get 5% bonus on your first stake!\n\n` +
      `${referralCode.link}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralCode.link)}&text=${text}`, '_blank');
  }, [referralCode]);

  return {
    referralCode,
    isLoading,
    copyCode,
    copyLink,
    shareToTwitter,
    shareToTelegram,
  };
}

/**
 * 推荐统计 Hook
 */
export function useReferralStats() {
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const address = evmAddress || solanaPublicKey?.toBase58();

  useEffect(() => {
    if (!address) {
      setStats(null);
      return;
    }

    // 模拟从 API 获取统计数据
    // 实际项目中应该调用后端 API
    setIsLoading(true);
    
    // 从 localStorage 获取模拟数据
    const storageKey = `popcow-referral-stats-${address}`;
    const saved = localStorage.getItem(storageKey);
    
    let mockStats: ReferralStats;
    
    if (saved) {
      try {
        mockStats = JSON.parse(saved);
      } catch {
        mockStats = createDefaultStats();
      }
    } else {
      mockStats = createDefaultStats();
    }
    
    // 计算等级相关
    mockStats.currentTier = calculateTier(mockStats.totalReferred);
    mockStats.currentRate = calculateRewardRate(mockStats.totalReferred);
    mockStats.nextTier = getNextTier(mockStats.currentTier);
    mockStats.referralsToNextTier = getReferralsToNextTier(mockStats.totalReferred, mockStats.nextTier);
    
    setStats(mockStats);
    setIsLoading(false);
  }, [address]);

  const refetch = useCallback(() => {
    // 重新获取数据
    if (address) {
      const storageKey = `popcow-referral-stats-${address}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const mockStats = JSON.parse(saved);
          mockStats.currentTier = calculateTier(mockStats.totalReferred);
          mockStats.currentRate = calculateRewardRate(mockStats.totalReferred);
          mockStats.nextTier = getNextTier(mockStats.currentTier);
          mockStats.referralsToNextTier = getReferralsToNextTier(mockStats.totalReferred, mockStats.nextTier);
          setStats(mockStats);
        } catch {}
      }
    }
  }, [address]);

  return { stats, isLoading, refetch };
}

function createDefaultStats(): ReferralStats {
  return {
    totalReferred: 0,
    activeStakers: 0,
    totalEarned: 0,
    pendingRewards: 0,
    currentTier: 'bronze',
    currentRate: 5,
    nextTier: 'silver',
    referralsToNextTier: 5,
  };
}

/**
 * 推荐记录 Hook
 */
export function useReferralRecords() {
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const address = evmAddress || solanaPublicKey?.toBase58();

  useEffect(() => {
    if (!address) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    
    // 从 localStorage 获取模拟数据
    const storageKey = `popcow-referral-records-${address}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecords(parsed.map((r: ReferralRecord) => ({
          ...r,
          joinedAt: new Date(r.joinedAt),
        })));
      } catch {
        setRecords([]);
      }
    } else {
      setRecords([]);
    }
    
    setIsLoading(false);
  }, [address]);

  return { records, isLoading };
}

/**
 * 领取奖励 Hook
 */
export function useClaimReferralRewards() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimRewards = useCallback(async () => {
    setIsPending(true);
    setError(null);
    setIsSuccess(false);

    try {
      // 模拟领取过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSuccess(true);
    } catch (e) {
      setError('Failed to claim rewards');
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    claimRewards,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * 检查推荐码 Hook
 */
export function useCheckReferralCode() {
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{ address: string; tier: ReferralTier } | null>(null);

  const checkCode = useCallback(async (code: string) => {
    setIsChecking(true);
    setIsValid(null);
    setReferrerInfo(null);

    try {
      // 模拟检查推荐码
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 简单验证格式
      if (code.startsWith('ALPHA-') && code.length === 10) {
        setIsValid(true);
        setReferrerInfo({
          address: '0x' + code.slice(6, 10).toLowerCase() + '...xxxx',
          tier: 'gold',
        });
      } else {
        setIsValid(false);
      }
    } catch {
      setIsValid(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkCode,
    isChecking,
    isValid,
    referrerInfo,
  };
}

/**
 * 组合 Hook - 完整推荐系统
 */
export function useReferral() {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { publicKey: solanaPublicKey, connected: solanaConnected } = useSolanaWalletSafe();

  const code = useReferralCode();
  const stats = useReferralStats();
  const records = useReferralRecords();
  const claim = useClaimReferralRewards();
  const check = useCheckReferralCode();

  const isConnected = evmConnected || solanaConnected;
  const address = evmAddress || solanaPublicKey?.toBase58();

  // 获取当前等级配置
  const tierConfig = useMemo(() => {
    if (!stats.stats) return TIER_CONFIG.bronze;
    return TIER_CONFIG[stats.stats.currentTier];
  }, [stats.stats]);

  // 获取下一等级配置
  const nextTierConfig = useMemo(() => {
    if (!stats.stats?.nextTier) return null;
    return TIER_CONFIG[stats.stats.nextTier];
  }, [stats.stats]);

  // 进度百分比 (到下一等级)
  const progressToNextTier = useMemo(() => {
    if (!stats.stats || !stats.stats.nextTier) return 100;
    const currentTierMin = TIER_CONFIG[stats.stats.currentTier].minReferrals;
    const nextTierMin = TIER_CONFIG[stats.stats.nextTier].minReferrals;
    const progress = ((stats.stats.totalReferred - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [stats.stats]);

  return {
    // 状态
    isConnected,
    address,
    
    // 推荐码
    referralCode: code.referralCode,
    copyCode: code.copyCode,
    copyLink: code.copyLink,
    shareToTwitter: code.shareToTwitter,
    shareToTelegram: code.shareToTelegram,
    
    // 统计
    stats: stats.stats,
    isLoadingStats: stats.isLoading,
    refetchStats: stats.refetch,
    
    // 记录
    records: records.records,
    isLoadingRecords: records.isLoading,
    
    // 领取
    claimRewards: claim.claimRewards,
    isClaiming: claim.isPending,
    claimSuccess: claim.isSuccess,
    claimError: claim.error,
    
    // 检查推荐码
    checkCode: check.checkCode,
    isCheckingCode: check.isChecking,
    isCodeValid: check.isValid,
    referrerInfo: check.referrerInfo,
    
    // 等级配置
    tierConfig,
    nextTierConfig,
    progressToNextTier,
    
    // 全局配置
    config: REFERRAL_CONFIG,
    allTiers: TIER_CONFIG,
  };
}
