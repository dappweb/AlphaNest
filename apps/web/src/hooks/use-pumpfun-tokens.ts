/**
 * Pump.fun 代币数据 Hook
 * 优化版本：结合 pump.fun API 和 Helius API 获取更准确的代币数据
 */

import { useState, useEffect, useCallback } from 'react';
import { useHeliusTokenPrices } from './use-helius';
import { HELIUS_API_KEY } from '@/config/helius';

export interface PumpFunToken {
  address: string;
  name: string;
  symbol: string;
  logo?: string;
  description?: string;
  creator?: string;
  timeAgo?: string;
  marketCap: string;
  change?: number;
  isLive?: boolean;
  priceUsd?: string;
  volume24h?: string;
  holderCount?: number;
  createdAt?: number;
  liquidity?: string;
}

const PUMP_FUN_API = 'https://frontend-api.pump.fun';

/**
 * 格式化市值
 */
function formatMarketCap(mcap: number | string): string {
  const num = typeof mcap === 'string' ? parseFloat(mcap) : mcap;
  
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * 格式化数字
 */
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

/**
 * 计算时间差
 */
function getTimeAgo(timestamp: number): string {
  const createdAt = timestamp * 1000;
  const now = Date.now();
  const diffMs = now - createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * 从 Helius 获取代币价格和额外信息
 */
async function enrichTokenWithHelius(token: any): Promise<Partial<PumpFunToken>> {
  if (!HELIUS_API_KEY || !token.mint) {
    return {};
  }

  try {
    // 使用 Jupiter Price API 获取价格信息
    const priceResponse = await fetch(
      `https://price.jup.ag/v6/price?ids=${token.mint}`
    );
    
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      const tokenPrice = priceData.data?.[token.mint];
      
      if (tokenPrice) {
        return {
          priceUsd: tokenPrice.price?.toFixed(8),
          change: tokenPrice.priceChange24h ? (tokenPrice.priceChange24h * 100) : undefined,
          volume24h: tokenPrice.volume24h ? formatNumber(tokenPrice.volume24h) : undefined,
        };
      }
    }

    // 尝试使用 DexScreener 获取 Raydium 池信息（如果代币已完成 bonding curve）
    if (token.complete) {
      try {
        const dexResponse = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${token.mint}`
        );
        
        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          const pair = dexData.pairs?.[0];
          
          if (pair) {
            return {
              priceUsd: pair.priceUsd,
              change: pair.priceChange?.h24 ? parseFloat(pair.priceChange.h24) : undefined,
              volume24h: pair.volume?.h24 ? formatNumber(pair.volume.h24) : undefined,
              liquidity: pair.liquidity?.usd ? formatNumber(pair.liquidity.usd) : undefined,
            };
          }
        }
      } catch (e) {
        // 忽略 DexScreener 错误
      }
    }
  } catch (error) {
    console.error('Failed to enrich token with Helius:', error);
  }

  return {};
}

/**
 * 获取热门代币（使用 Helius 增强数据）
 */
export function useTrendingTokens() {
  const [tokens, setTokens] = useState<PumpFunToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 从 pump.fun API 获取热门代币
      const response = await fetch(
        `${PUMP_FUN_API}/coins?offset=0&limit=20&sort=market_cap&order=DESC&includeNsfw=false`,
        { 
          cache: 'no-store', // 禁用缓存，获取最新数据
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      
      // 批量获取价格信息
      const mintAddresses = data.map((t: any) => t.mint).filter(Boolean);
      const pricePromises = mintAddresses.map((mint: string) => 
        enrichTokenWithHelius({ mint, complete: data.find((t: any) => t.mint === mint)?.complete })
      );
      const enrichedData = await Promise.all(pricePromises);
      
      const formattedTokens: PumpFunToken[] = await Promise.all(
        data.map(async (token: any, index: number) => {
          const enriched = enrichedData[index] || {};
          
          // 计算市值（优先使用 pump.fun 数据，如果没有则使用价格计算）
          let marketCap = token.usd_market_cap || token.market_cap || 0;
          if (!marketCap && enriched.priceUsd && token.total_supply) {
            const supply = token.total_supply / Math.pow(10, token.decimals || 6);
            marketCap = parseFloat(enriched.priceUsd) * supply;
          }

          return {
            address: token.mint,
            name: token.name,
            symbol: token.symbol,
            logo: token.image_uri,
            description: token.description,
            creator: token.creator ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : undefined,
            timeAgo: getTimeAgo(token.created_timestamp),
            marketCap: formatMarketCap(marketCap),
            change: enriched.change,
            isLive: !token.complete, // bonding curve 阶段为 live
            priceUsd: enriched.priceUsd || (marketCap && token.total_supply 
              ? (marketCap / (token.total_supply / Math.pow(10, token.decimals || 6))).toFixed(8)
              : undefined),
            volume24h: enriched.volume24h,
            holderCount: token.holder_count,
            liquidity: enriched.liquidity,
            createdAt: token.created_timestamp,
          };
        })
      );

      setTokens(formattedTokens);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
    // 每 60 秒刷新一次
    const interval = setInterval(fetchTokens, 60000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}

/**
 * 获取新代币（使用 Helius 增强数据）
 */
export function useNewTokens() {
  const [tokens, setTokens] = useState<PumpFunToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 从 pump.fun API 获取新代币
      const response = await fetch(
        `${PUMP_FUN_API}/coins?offset=0&limit=50&sort=created_timestamp&order=DESC&includeNsfw=false`,
        { 
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      
      // 批量获取价格信息（只获取前 20 个以提高性能）
      const tokensToEnrich = data.slice(0, 20);
      const enrichedData = await Promise.all(
        tokensToEnrich.map((token: any) => enrichTokenWithHelius(token))
      );
      
      const formattedTokens: PumpFunToken[] = data.map((token: any, index: number) => {
        const enriched = index < enrichedData.length ? enrichedData[index] : {};
        
        let marketCap = token.usd_market_cap || token.market_cap || 0;
        if (!marketCap && enriched.priceUsd && token.total_supply) {
          const supply = token.total_supply / Math.pow(10, token.decimals || 6);
          marketCap = parseFloat(enriched.priceUsd) * supply;
        }

        return {
          address: token.mint,
          name: token.name,
          symbol: token.symbol,
          logo: token.image_uri,
          description: token.description,
          creator: token.creator ? `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}` : undefined,
          timeAgo: getTimeAgo(token.created_timestamp),
          marketCap: formatMarketCap(marketCap),
          change: enriched.change,
          isLive: !token.complete,
          priceUsd: enriched.priceUsd || (marketCap && token.total_supply 
            ? (marketCap / (token.total_supply / Math.pow(10, token.decimals || 6))).toFixed(8)
            : undefined),
          volume24h: enriched.volume24h,
          holderCount: token.holder_count,
          liquidity: enriched.liquidity,
          createdAt: token.created_timestamp,
        };
      });

      setTokens(formattedTokens);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
    // 每 30 秒刷新一次
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}
