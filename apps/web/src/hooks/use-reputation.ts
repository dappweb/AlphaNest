/**
 * Reputation Registry Contract Hooks
 * Dev 信誉系统交互
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================
// Types
// ============================================

export type DevTier = 'unranked' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type RiskLevel = 'unknown' | 'low' | 'medium' | 'high' | 'critical';

export interface DevProfile {
  address: string;
  alias: string;
  score: number;
  tier: DevTier;
  verified: boolean;
  totalLaunches: number;
  successfulLaunches: number;
  rugCount: number;
  totalVolume: string;
  avgAthMultiplier: number;
  winRate: number;
  riskLevel: RiskLevel;
  createdAt: number;
  updatedAt: number;
}

export interface LaunchRecord {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  launchTime: number;
  initialLiquidity: string;
  athMarketCap: string;
  currentMarketCap: string;
  isRugged: boolean;
  isGraduated: boolean;
  holderCount: number;
}

export interface DevLeaderboardEntry {
  rank: number;
  address: string;
  alias: string;
  score: number;
  tier: DevTier;
  verified: boolean;
  winRate: number;
  totalLaunches: number;
}

export interface SubscriptionSettings {
  notifyTelegram: boolean;
  notifyDiscord: boolean;
  autoBuyEnabled: boolean;
  autoBuyAmount: string;
}

// ============================================
// API Functions
// ============================================

async function fetchDevProfile(address: string): Promise<DevProfile> {
  const response = await fetch(`${API_BASE}/api/v1/dev/${address}/score`);
  if (!response.ok) throw new Error('Failed to fetch dev profile');
  const data = await response.json();
  return data.data;
}

async function fetchDevLaunches(address: string): Promise<LaunchRecord[]> {
  const response = await fetch(`${API_BASE}/api/v1/dev/${address}/launches`);
  if (!response.ok) throw new Error('Failed to fetch dev launches');
  const data = await response.json();
  return data.data;
}

async function fetchLeaderboard(params: {
  page?: number;
  limit?: number;
  sortBy?: 'score' | 'win_rate' | 'volume';
  chain?: string;
}): Promise<{ devs: DevLeaderboardEntry[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sortBy) searchParams.set('sort_by', params.sortBy);
  if (params.chain) searchParams.set('chain', params.chain);

  const response = await fetch(`${API_BASE}/api/v1/dev/leaderboard?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  const data = await response.json();
  return data.data;
}

async function subscribeToDev(
  devAddress: string,
  settings: SubscriptionSettings
): Promise<{ subscriptionId: string }> {
  const response = await fetch(`${API_BASE}/api/v1/dev/${devAddress}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error('Failed to subscribe');
  const data = await response.json();
  return data.data;
}

async function unsubscribeFromDev(devAddress: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/dev/${devAddress}/unsubscribe`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to unsubscribe');
}

async function fetchUserSubscriptions(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/v1/user/subscriptions`);
  if (!response.ok) throw new Error('Failed to fetch subscriptions');
  const data = await response.json();
  return data.data;
}

// ============================================
// Hooks
// ============================================

/**
 * 获取 Dev 完整资料
 */
export function useDevProfile(address: string | undefined) {
  return useQuery({
    queryKey: ['dev-profile', address],
    queryFn: () => fetchDevProfile(address!),
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * 获取 Dev 发币历史
 */
export function useDevLaunches(address: string | undefined) {
  return useQuery({
    queryKey: ['dev-launches', address],
    queryFn: () => fetchDevLaunches(address!),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 获取 Dev 排行榜
 */
export function useDevLeaderboard(params: {
  page?: number;
  limit?: number;
  sortBy?: 'score' | 'win_rate' | 'volume';
  chain?: string;
} = {}) {
  return useQuery({
    queryKey: ['dev-leaderboard', params],
    queryFn: () => fetchLeaderboard(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * 订阅 Dev
 */
export function useSubscribeToDev() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      devAddress,
      settings,
    }: {
      devAddress: string;
      settings: SubscriptionSettings;
    }) => subscribeToDev(devAddress, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
  });
}

/**
 * 取消订阅 Dev
 */
export function useUnsubscribeFromDev() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (devAddress: string) => unsubscribeFromDev(devAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
  });
}

/**
 * 获取用户的订阅列表
 */
export function useUserSubscriptions() {
  return useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: fetchUserSubscriptions,
    staleTime: 60 * 1000,
  });
}

/**
 * 检查是否已订阅某 Dev
 */
export function useIsSubscribed(devAddress: string | undefined) {
  const { data: subscriptions } = useUserSubscriptions();

  return useMemo(() => {
    if (!devAddress || !subscriptions) return false;
    return subscriptions.includes(devAddress.toLowerCase());
  }, [devAddress, subscriptions]);
}

/**
 * 组合 Hook - Dev 页面完整数据
 */
export function useDevPage(address: string | undefined) {
  const profile = useDevProfile(address);
  const launches = useDevLaunches(address);
  const isSubscribed = useIsSubscribed(address);
  const subscribe = useSubscribeToDev();
  const unsubscribe = useUnsubscribeFromDev();

  return {
    profile: profile.data,
    launches: launches.data,
    isSubscribed,
    isLoading: profile.isLoading || launches.isLoading,
    error: profile.error || launches.error,

    subscribe: (settings: SubscriptionSettings) =>
      subscribe.mutateAsync({ devAddress: address!, settings }),
    unsubscribe: () => unsubscribe.mutateAsync(address!),

    isSubscribing: subscribe.isPending,
    isUnsubscribing: unsubscribe.isPending,
  };
}

// ============================================
// Utility Functions
// ============================================

export function getTierColor(tier: DevTier): string {
  const colors: Record<DevTier, string> = {
    unranked: '#6B7280',  // gray
    bronze: '#CD7F32',    // bronze
    silver: '#C0C0C0',    // silver
    gold: '#FFD700',      // gold
    platinum: '#E5E4E2',  // platinum
    diamond: '#B9F2FF',   // diamond blue
  };
  return colors[tier];
}

export function getTierLabel(tier: DevTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    unknown: '#6B7280',
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626',
  };
  return colors[level];
}

export function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatVolume(volume: string): string {
  const num = parseFloat(volume);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}
