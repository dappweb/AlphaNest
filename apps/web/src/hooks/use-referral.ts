/**
 * Referral System Hook
 * 推荐系统 - 邀请好友获得奖励
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSolanaReferrerInfo } from './use-solana-referral';
import { useWallet } from '@solana/wallet-adapter-react';
// 项目仅支持 Solana，已移除 wagmi

// Safe Solana wallet hook - returns null if provider not available
// 直接使用 useWallet hook，确保在 WalletProvider 内部调用
function useSolanaWalletSafe() {
  // 直接使用 useWallet hook
  // 这必须在 WalletProvider 内部调用
  // 如果 WalletProvider 未初始化，React 会抛出错误
  // 但因为我们确保所有组件都在 WalletProvider 内部，这应该是安全的
  const wallet = useWallet();

  // 安全地访问属性
  return {
    publicKey: wallet?.publicKey || null,
    connected: wallet?.connected || false,
  };
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
  totalEarned: number; // USD 金额
  pendingRewards: number; // USD 金额
  currentTier: ReferralTier;
  currentRate: number;
  nextTier: ReferralTier | null;
  referralsToNextTier: number;
  // PopCowDefi 代币相关信息
  totalEarnedPopCowDefi?: number; // PopCowDefi 代币数量
  pendingRewardsPopCowDefi?: number; // PopCowDefi 代币数量
  popCowDefiPrice?: number; // PopCowDefi 代币价格（USD）
}

export interface ReferralRecord {
  id: string;
  address: string;
  chain: 'solana'; // 仅支持 Solana
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
 * 使用钱包地址作为邀请码
 */
export function useReferralCode() {
  // 项目仅支持 Solana，移除 EVM 钱包
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const address = solanaPublicKey?.toBase58(); // 仅使用 Solana 地址

  useEffect(() => {
    if (!address) {
      setReferralCode(null);
      return;
    }

    // 直接使用钱包地址作为推荐码
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.popcow.xyz';
    const referralLink = `${baseUrl}/staking?ref=${address}`;
    
    const referral: ReferralCode = {
      code: address, // 使用钱包地址作为推荐码
      link: referralLink,
      createdAt: new Date(),
      usageCount: 0,
    };
    
    setReferralCode(referral);
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
    const shortAddress = `${referralCode.code.slice(0, 4)}...${referralCode.code.slice(-4)}`;
    const text = encodeURIComponent(
      `🦙 I'm earning passive income with PopCowDefi!\n\n` +
      `✅ Stake Meme tokens on Solana (pump.fun)\n` +
      `✅ Get insurance protection\n` +
      `✅ Earn up to 25% APY\n\n` +
      `Join with my referral code and get 5% bonus! 🎁\n\n` +
      `Code: ${shortAddress}\n` +
      `${referralCode.link}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [referralCode]);

  const shareToTelegram = useCallback(() => {
    if (!referralCode) return;
    const shortAddress = `${referralCode.code.slice(0, 4)}...${referralCode.code.slice(-4)}`;
    const text = encodeURIComponent(
      `🦙 PopCowDefi - Solana Meme Token Staking & Insurance\n\n` +
      `Join with my referral code: ${shortAddress}\n` +
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
  // 使用 Solana 推荐系统的真实数据
  const { referrerInfo, isLoading: isLoadingSolana } = useSolanaReferrerInfo();
  
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoadingSolana) {
      setIsLoading(true);
      return;
    }

    if (!referrerInfo) {
      setStats(createDefaultStats());
      setIsLoading(false);
      return;
    }

    // 从 Solana 推荐系统数据构建统计
    const solanaStats: ReferralStats = {
      totalReferred: referrerInfo.totalReferred,
      activeStakers: referrerInfo.totalReferred, // 简化：假设所有推荐人都是活跃的
      totalEarned: referrerInfo.totalEarned,
      pendingRewards: referrerInfo.pendingRewards,
      currentTier: referrerInfo.currentTier.name.toLowerCase() as ReferralTier,
      currentRate: referrerInfo.currentRate,
      nextTier: getNextTier(referrerInfo.currentTier.name.toLowerCase() as ReferralTier),
      referralsToNextTier: getReferralsToNextTier(
        referrerInfo.totalReferred,
        getNextTier(referrerInfo.currentTier.name.toLowerCase() as ReferralTier)
      ),
      totalEarnedPopCowDefi: referrerInfo.totalEarnedPopCowDefi,
      pendingRewardsPopCowDefi: referrerInfo.pendingRewardsPopCowDefi,
      popCowDefiPrice: referrerInfo.popCowDefiPrice,
    };
    
    setStats(solanaStats);
    setIsLoading(false);
  }, [referrerInfo, isLoadingSolana]);

  const refetch = useCallback(() => {
    // 重新获取数据会由 useSolanaReferrerInfo 处理
  }, []);

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
  // 项目仅支持 Solana，移除 EVM 钱包
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const address = solanaPublicKey?.toBase58(); // 仅使用 Solana 地址

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
  // 项目仅支持 Solana，移除 EVM 钱包
  const evmAddress = null;
  const evmConnected = false;
  const { publicKey: solanaPublicKey, connected: solanaConnected } = useSolanaWalletSafe();

  const code = useReferralCode();
  const stats = useReferralStats();
  const records = useReferralRecords();
  const claim = useClaimReferralRewards();
  const check = useCheckReferralCode();

  const isConnected = solanaConnected; // 仅支持 Solana
  const address = solanaPublicKey?.toBase58(); // 仅使用 Solana 地址

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
