/**
 * Referral System Hook
 * Invite friends to earn rewards
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSolanaReferrerInfo } from './use-solana-referral';
import { useWallet } from '@solana/wallet-adapter-react';
// Project only supports Solana, wagmi removed

// Safe Solana wallet hook - returns null if provider not available
// Directly use useWallet hook, ensure it's called inside WalletProvider
function useSolanaWalletSafe() {
  // Directly use useWallet hook
  // This must be called inside WalletProvider
  // If WalletProvider is not initialized, React will throw an error
  // But since we ensure all components are inside WalletProvider, this should be safe
  const wallet = useWallet();

  // Safely access properties
  return {
    publicKey: wallet?.publicKey || null,
    connected: wallet?.connected || false,
  };
}

// Default referrer (admin address) - new users must have a referrer
export const DEFAULT_REFERRER_EVM = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';
export const DEFAULT_REFERRER_SOLANA = process.env.NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS || 'AdminSolanaWalletAddressHere';

// Referral system configuration
export const REFERRAL_CONFIG = {
  // Reward rates (based on invitee's staking/insurance amount)
  rewardRates: {
    tier1: { minReferrals: 1, rate: 5 },   // 1-4 people: 5%
    tier2: { minReferrals: 5, rate: 8 },   // 5-9 people: 8%
    tier3: { minReferrals: 10, rate: 10 }, // 10-24 people: 10%
    tier4: { minReferrals: 25, rate: 12 }, // 25-49 people: 12%
    tier5: { minReferrals: 50, rate: 15 }, // 50+ people: 15%
  },
  // Invitee reward
  inviteeBonus: 5, // Invitee gets 5% bonus on first stake
  // Minimum claim amount
  minClaimAmount: 10, // $10 USDC
  // Default referrer (admin)
  defaultReferrer: {
    evm: DEFAULT_REFERRER_EVM,
    solana: DEFAULT_REFERRER_SOLANA,
  },
  // New users must have a referrer
  requireReferrer: true,
};

// Referral tiers
export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export const TIER_CONFIG: Record<ReferralTier, { name: string; icon: string; minReferrals: number; rate: number; color: string }> = {
  bronze: { name: 'Bronze', icon: '🥉', minReferrals: 1, rate: 5, color: 'text-orange-400' },
  silver: { name: 'Silver', icon: '🥈', minReferrals: 5, rate: 8, color: 'text-gray-400' },
  gold: { name: 'Gold', icon: '🥇', minReferrals: 10, rate: 10, color: 'text-yellow-500' },
  platinum: { name: 'Platinum', icon: '💎', minReferrals: 25, rate: 12, color: 'text-blue-400' },
  diamond: { name: 'Diamond', icon: '👑', minReferrals: 50, rate: 15, color: 'text-purple-500' },
};

// Type definitions
export interface ReferralStats {
  totalReferred: number;
  activeStakers: number;
  totalEarned: number; // USD amount
  pendingRewards: number; // USD amount
  currentTier: ReferralTier;
  currentRate: number;
  nextTier: ReferralTier | null;
  referralsToNextTier: number;
  // PopCowDefi token related information
  totalEarnedPopCowDefi?: number; // PopCowDefi token amount
  pendingRewardsPopCowDefi?: number; // PopCowDefi token amount
  popCowDefiPrice?: number; // PopCowDefi token price (USD)
}

export interface ReferralRecord {
  id: string;
  address: string;
  chain: 'solana'; // Solana only
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

// Generate referral code
function generateReferralCode(address: string): string {
  const prefix = 'ALPHA';
  const hash = address.slice(2, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${prefix}-${hash}${random}`;
}

// Get referral link
function getReferralLink(code: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.popcow.xyz';
  return `${baseUrl}?ref=${code}`;
}

// Calculate current tier
function calculateTier(referralCount: number): ReferralTier {
  if (referralCount >= 50) return 'diamond';
  if (referralCount >= 25) return 'platinum';
  if (referralCount >= 10) return 'gold';
  if (referralCount >= 5) return 'silver';
  return 'bronze';
}

// Calculate current reward rate
function calculateRewardRate(referralCount: number): number {
  const tier = calculateTier(referralCount);
  return TIER_CONFIG[tier].rate;
}

// Get next tier
function getNextTier(currentTier: ReferralTier): ReferralTier | null {
  const tiers: ReferralTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1];
  }
  return null;
}

// Calculate referrals needed to reach next tier
function getReferralsToNextTier(currentCount: number, nextTier: ReferralTier | null): number {
  if (!nextTier) return 0;
  return TIER_CONFIG[nextTier].minReferrals - currentCount;
}

/**
 * Referral code management Hook
 * Use wallet address as referral code
 */
export function useReferralCode() {
  // Project only supports Solana, EVM wallet removed
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const address = solanaPublicKey?.toBase58(); // Solana address only

  useEffect(() => {
    if (!address) {
      setReferralCode(null);
      return;
    }

    // Directly use wallet address as referral code
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.popcow.xyz';
    const referralLink = `${baseUrl}/staking?ref=${address}`;
    
    const referral: ReferralCode = {
      code: address, // Use wallet address as referral code
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
 * Referral statistics Hook
 */
export function useReferralStats() {
  // Use real data from Solana referral system
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

    // Build statistics from Solana referral system data
    const solanaStats: ReferralStats = {
      totalReferred: referrerInfo.totalReferred,
      activeStakers: referrerInfo.totalReferred, // Simplified: assume all referrals are active
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
    // Data refetching will be handled by useSolanaReferrerInfo
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
 * Referral records Hook
 */
export function useReferralRecords() {
  // Project only supports Solana, EVM wallet removed
  const { publicKey: solanaPublicKey } = useSolanaWalletSafe();
  
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const address = solanaPublicKey?.toBase58(); // Solana address only

  useEffect(() => {
    if (!address) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    
    // Get mock data from localStorage
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
 * Claim rewards Hook
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
      // Simulate claim process
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
 * Check referral code Hook
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
      // Simulate checking referral code
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple format validation
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
 * Combined Hook - Complete referral system
 */
export function useReferral() {
  // Project only supports Solana, EVM wallet removed
  const evmAddress = null;
  const evmConnected = false;
  const { publicKey: solanaPublicKey, connected: solanaConnected } = useSolanaWalletSafe();

  const code = useReferralCode();
  const stats = useReferralStats();
  const records = useReferralRecords();
  const claim = useClaimReferralRewards();
  const check = useCheckReferralCode();

  const isConnected = solanaConnected; // Solana only
  const address = solanaPublicKey?.toBase58(); // Solana address only

  // Get current tier configuration
  const tierConfig = useMemo(() => {
    if (!stats.stats) return TIER_CONFIG.bronze;
    return TIER_CONFIG[stats.stats.currentTier];
  }, [stats.stats]);

  // Get next tier configuration
  const nextTierConfig = useMemo(() => {
    if (!stats.stats?.nextTier) return null;
    return TIER_CONFIG[stats.stats.nextTier];
  }, [stats.stats]);

  // Progress percentage (to next tier)
  const progressToNextTier = useMemo(() => {
    if (!stats.stats || !stats.stats.nextTier) return 100;
    const currentTierMin = TIER_CONFIG[stats.stats.currentTier].minReferrals;
    const nextTierMin = TIER_CONFIG[stats.stats.nextTier].minReferrals;
    const progress = ((stats.stats.totalReferred - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [stats.stats]);

  return {
    // State
    isConnected,
    address,
    
    // Referral code
    referralCode: code.referralCode,
    copyCode: code.copyCode,
    copyLink: code.copyLink,
    shareToTwitter: code.shareToTwitter,
    shareToTelegram: code.shareToTelegram,
    
    // Statistics
    stats: stats.stats,
    isLoadingStats: stats.isLoading,
    refetchStats: stats.refetch,
    
    // Records
    records: records.records,
    isLoadingRecords: records.isLoading,
    
    // Claim
    claimRewards: claim.claimRewards,
    isClaiming: claim.isPending,
    claimSuccess: claim.isSuccess,
    claimError: claim.error,
    
    // Check referral code
    checkCode: check.checkCode,
    isCheckingCode: check.isChecking,
    isCodeValid: check.isValid,
    referrerInfo: check.referrerInfo,
    
    // Tier configuration
    tierConfig,
    nextTierConfig,
    progressToNextTier,
    
    // Global configuration
    config: REFERRAL_CONFIG,
    allTiers: TIER_CONFIG,
  };
}
