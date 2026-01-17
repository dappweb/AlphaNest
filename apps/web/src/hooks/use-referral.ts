/**
 * Referral System Hook
 * 推荐系统相关功能
 */

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode: string;
  referralLink: string;
}

export interface ReferralRecord {
  id: string;
  referredAddress: string;
  referredAt: number;
  status: 'pending' | 'active' | 'inactive';
  earnings: number;
  trades: number;
}

export interface ReferralTier {
  name: string;
  minReferrals: number;
  rewardRate: number;
  bonusMultiplier: number;
}

const REFERRAL_TIERS: ReferralTier[] = [
  { name: 'Starter', minReferrals: 0, rewardRate: 0.1, bonusMultiplier: 1 },
  { name: 'Bronze', minReferrals: 5, rewardRate: 0.12, bonusMultiplier: 1.1 },
  { name: 'Silver', minReferrals: 15, rewardRate: 0.15, bonusMultiplier: 1.25 },
  { name: 'Gold', minReferrals: 50, rewardRate: 0.18, bonusMultiplier: 1.5 },
  { name: 'Platinum', minReferrals: 100, rewardRate: 0.2, bonusMultiplier: 2 },
  { name: 'Diamond', minReferrals: 500, rewardRate: 0.25, bonusMultiplier: 3 },
];

/**
 * 生成推荐码
 */
function generateReferralCode(address: string): string {
  // 使用地址的一部分 + 随机字符生成推荐码
  const prefix = address.slice(2, 6).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * 获取推荐链接
 */
function getReferralLink(code: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://app.popcow.xyz';
  return `${baseUrl}/?ref=${code}`;
}

/**
 * 推荐系统 Hook
 */
export function useReferral() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取或生成推荐码
  const referralCode = address ? generateReferralCode(address) : '';
  const referralLink = referralCode ? getReferralLink(referralCode) : '';

  // 获取推荐统计
  const fetchStats = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/referral/stats`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          // Fallback to generated code if API doesn't return data
          setStats({
            totalReferrals: 0,
            activeReferrals: 0,
            totalEarnings: 0,
            pendingEarnings: 0,
            referralCode,
            referralLink,
          });
        }
      } else {
        // Fallback to generated code on error
        setStats({
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          referralCode,
          referralLink,
        });
      }
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      setError('Failed to fetch referral stats');
      // Fallback to generated code
      setStats({
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        referralCode,
        referralLink,
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, referralCode, referralLink]);

  // 获取推荐记录
  const fetchRecords = useCallback(async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/referral/history`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setRecords(result.data);
        } else {
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to fetch referral records:', err);
      setRecords([]);
    }
  }, [address]);

  // 获取当前等级
  const getCurrentTier = useCallback(() => {
    if (!stats) return REFERRAL_TIERS[0];
    
    const sorted = [...REFERRAL_TIERS].reverse();
    return sorted.find(tier => stats.totalReferrals >= tier.minReferrals) || REFERRAL_TIERS[0];
  }, [stats]);

  // 获取下一等级
  const getNextTier = useCallback(() => {
    const currentTier = getCurrentTier();
    const currentIndex = REFERRAL_TIERS.findIndex(t => t.name === currentTier.name);
    return REFERRAL_TIERS[currentIndex + 1] || null;
  }, [getCurrentTier]);

  // 复制推荐链接
  const copyReferralLink = useCallback(async () => {
    if (!referralLink) return false;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, [referralLink]);

  // 复制推荐码
  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return false;
    
    try {
      await navigator.clipboard.writeText(referralCode);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, [referralCode]);

  // 检查URL中是否有推荐码
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // 保存推荐码到 localStorage
      localStorage.setItem('alphanest_referrer', refCode);
    }
  }, []);

  // 初始化获取数据
  useEffect(() => {
    if (isConnected && address) {
      fetchStats();
      fetchRecords();
    }
  }, [isConnected, address, fetchStats, fetchRecords]);

  return {
    // 状态
    isConnected,
    isLoading,
    error,
    
    // 数据
    stats,
    records,
    referralCode,
    referralLink,
    
    // 等级
    currentTier: getCurrentTier(),
    nextTier: getNextTier(),
    tiers: REFERRAL_TIERS,
    
    // 操作
    copyReferralLink,
    copyReferralCode,
    refetch: fetchStats,
  };
}

/**
 * 推荐排行榜 Hook
 */
export function useReferralLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<{
    address: string;
    referrals: number;
    earnings: number;
    tier: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/v1/referral/leaderboard`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setLeaderboard(result.data);
          } else {
            setLeaderboard([]);
          }
        } else {
          setLeaderboard([]);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return {
    leaderboard,
    isLoading,
  };
}
