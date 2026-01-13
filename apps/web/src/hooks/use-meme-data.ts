/**
 * Meme 平台数据 Hook
 * 聚合 Pump.fun, GMGN, Birdeye, DexScreener 数据
 */

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

// ============================================
// 类型定义
// ============================================

export interface MemeToken {
  address: string;
  chain: 'solana' | 'base' | 'ethereum' | 'bsc';
  name: string;
  symbol: string;
  logo?: string;
  description?: string;
  priceUsd: string;
  priceChange5m?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  marketCap?: string;
  fdv?: string;
  liquidity?: string;
  volume24h?: string;
  txns24h?: { buys: number; sells: number };
  holders?: number;
  createdAt?: number;
  pairAddress?: string;
  dex?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  source: 'pump.fun' | 'gmgn' | 'birdeye' | 'dexscreener';
}

export interface SmartMoneyTrade {
  wallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  amount: string;
  amountUsd: string;
  priceUsd: string;
  timestamp: number;
  txHash: string;
  pnl?: string;
  pnlPercent?: number;
}

export interface TopTrader {
  wallet: string;
  label?: string;
  totalPnl: string;
  totalTrades: number;
  winRate: number;
  avgHoldTime: string;
  recentTokens: string[];
}

export interface AggregatedData {
  trending: MemeToken[];
  newTokens: MemeToken[];
  smartMoney: SmartMoneyTrade[];
  topTraders: TopTrader[];
  sources: {
    pumpfun: boolean;
    gmgn: boolean;
    birdeye: boolean;
    dexscreener: boolean;
  };
  updatedAt: number;
}

export type DataSource = 'all' | 'pumpfun' | 'gmgn' | 'birdeye' | 'dexscreener';
export type Chain = 'solana' | 'base' | 'ethereum' | 'bsc';

// ============================================
// 聚合数据 Hook
// ============================================

export function useAggregatedMemeData(chain: Chain = 'solana') {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/v1/meme/aggregate?chain=${chain}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch aggregated data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [chain]);

  useEffect(() => {
    fetchData();
    
    // 每分钟刷新
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================
// 热门代币 Hook
// ============================================

export function useTrendingTokens(
  chain: Chain = 'solana',
  source: DataSource = 'all',
  limit = 50
) {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        chain,
        limit: limit.toString(),
        ...(source !== 'all' && { source }),
      });
      
      const response = await fetch(`${API_URL}/api/v1/meme/trending?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending tokens');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTokens(result.data || []);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [chain, source, limit]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tokens, loading, error, refetch: fetchData };
}

// ============================================
// 新代币 Hook
// ============================================

export function useNewTokens(
  chain: Chain = 'solana',
  source: DataSource = 'all',
  limit = 50
) {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        chain,
        limit: limit.toString(),
        ...(source !== 'all' && { source }),
      });
      
      const response = await fetch(`${API_URL}/api/v1/meme/new?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch new tokens');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTokens(result.data || []);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [chain, source, limit]);

  useEffect(() => {
    fetchData();
    
    // 新代币更频繁刷新
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tokens, loading, error, refetch: fetchData };
}

// ============================================
// Pump.fun 数据 Hook
// ============================================

export function usePumpFunData(type: 'trending' | 'new' = 'trending', limit = 50) {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = type === 'trending' ? 'trending' : 'new';
      const response = await fetch(`${API_URL}/api/v1/meme/pumpfun/${endpoint}?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Pump.fun data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTokens(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tokens, loading, error, refetch: fetchData };
}

// ============================================
// GMGN 数据 Hook
// ============================================

export function useGMGNData(chain: Chain = 'solana') {
  const [trending, setTrending] = useState<MemeToken[]>([]);
  const [smartMoney, setSmartMoney] = useState<SmartMoneyTrade[]>([]);
  const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const gmgnChain = chain === 'solana' ? 'sol' : chain;
    
    try {
      const [trendingRes, smartMoneyRes, tradersRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/v1/meme/gmgn/trending?chain=${gmgnChain}&limit=50`),
        fetch(`${API_URL}/api/v1/meme/gmgn/smart-money?chain=${gmgnChain}&limit=50`),
        fetch(`${API_URL}/api/v1/meme/gmgn/top-traders?chain=${gmgnChain}&limit=50`),
      ]);
      
      if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
        const data = await trendingRes.value.json();
        if (data.success) setTrending(data.data || []);
      }
      
      if (smartMoneyRes.status === 'fulfilled' && smartMoneyRes.value.ok) {
        const data = await smartMoneyRes.value.json();
        if (data.success) setSmartMoney(data.data || []);
      }
      
      if (tradersRes.status === 'fulfilled' && tradersRes.value.ok) {
        const data = await tradersRes.value.json();
        if (data.success) setTopTraders(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [chain]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { trending, smartMoney, topTraders, loading, error, refetch: fetchData };
}

// ============================================
// Birdeye 数据 Hook
// ============================================

export function useBirdeyeData(limit = 50) {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/v1/meme/birdeye/trending?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Birdeye data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTokens(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tokens, loading, error, refetch: fetchData };
}

// ============================================
// DexScreener 数据 Hook
// ============================================

export function useDexScreenerData(chain?: Chain, limit = 50) {
  const [tokens, setTokens] = useState<MemeToken[]>([]);
  const [boosted, setBoosted] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (chain) params.set('chain', chain);
      
      const [trendingRes, boostedRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/v1/meme/dexscreener/trending?${params}`),
        fetch(`${API_URL}/api/v1/meme/dexscreener/boosted?limit=${limit}`),
      ]);
      
      if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
        const data = await trendingRes.value.json();
        if (data.success) setTokens(data.data || []);
      }
      
      if (boostedRes.status === 'fulfilled' && boostedRes.value.ok) {
        const data = await boostedRes.value.json();
        if (data.success) setBoosted(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [chain, limit]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { tokens, boosted, loading, error, refetch: fetchData };
}

// ============================================
// 工具函数
// ============================================

export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return '$0.00';
  
  if (num < 0.000001) return `$${num.toExponential(2)}`;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  if (num < 1) return `$${num.toFixed(4)}`;
  if (num < 1000) return `$${num.toFixed(2)}`;
  if (num < 1000000) return `$${(num / 1000).toFixed(2)}K`;
  if (num < 1000000000) return `$${(num / 1000000).toFixed(2)}M`;
  return `$${(num / 1000000000).toFixed(2)}B`;
}

export function formatMarketCap(mc: string | number): string {
  const num = typeof mc === 'string' ? parseFloat(mc) : mc;
  if (isNaN(num) || num === 0) return '-';
  
  if (num < 1000) return `$${num.toFixed(0)}`;
  if (num < 1000000) return `$${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `$${(num / 1000000).toFixed(2)}M`;
  return `$${(num / 1000000000).toFixed(2)}B`;
}

export function formatPriceChange(change: number | undefined): string {
  if (change === undefined || isNaN(change)) return '-';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function getSourceColor(source: string): string {
  switch (source) {
    case 'pump.fun': return 'bg-green-500';
    case 'gmgn': return 'bg-blue-500';
    case 'birdeye': return 'bg-purple-500';
    case 'dexscreener': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

export function getSourceLabel(source: string): string {
  switch (source) {
    case 'pump.fun': return 'Pump.fun';
    case 'gmgn': return 'GMGN';
    case 'birdeye': return 'Birdeye';
    case 'dexscreener': return 'DexScreener';
    default: return source;
  }
}
