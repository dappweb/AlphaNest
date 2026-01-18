/**
 * Pyth Network 价格预言机 Hook
 * 从 Pyth Network 获取 Solana 代币实时价格
 * 
 * Pyth Network: https://pyth.network
 * Price Feed IDs: https://pyth.network/developers/price-feed-ids
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import {
  PYTH_PRICE_ACCOUNTS,
  getCurrentPriceFeeds,
  SOLANA_TOKENS,
  PYTH_PROGRAM_ID,
} from '@/config/solana';

// Pyth 价格数据结构
interface PythPriceData {
  price: number;
  conf: number; // 置信区间
  expo: number; // 指数
  publishTime: number;
  emaPrice: number; // 指数移动平均价格
  emaConf: number;
}

interface PriceInfo {
  price: number;
  priceFormatted: string;
  confidence: number;
  publishTime: Date;
  emaPrice: number;
  isStale: boolean; // 价格是否过期 (>60秒)
}

// 价格缓存
const priceCache = new Map<string, { price: PriceInfo; timestamp: number }>();
const CACHE_TTL = 10000; // 10秒缓存

/**
 * 解析 Pyth 价格账户数据
 * 参考: https://github.com/pyth-network/pyth-client-js
 */
function parsePythPriceData(data: Buffer): PythPriceData | null {
  try {
    // Pyth Price Account 数据结构
    // Magic number (4 bytes) + Version (4 bytes) + Type (4 bytes) + Size (4 bytes)
    // + Price type (4 bytes) + Exponent (4 bytes) + Num components (4 bytes)
    // + Num quoters (4 bytes) + Last slot (8 bytes) + Valid slot (8 bytes)
    // + EMA price (8 bytes) + EMA conf (8 bytes)
    // + Timestamp (8 bytes) + Min publishers (1 byte) + ...
    // + Price (8 bytes) + Conf (8 bytes) + Status (4 bytes) + ...
    
    if (data.length < 200) {
      console.warn('Pyth price data too short');
      return null;
    }

    // 简化解析 - 直接读取关键字段
    // 这是一个简化版本，实际部署建议使用 @pythnetwork/client
    
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    
    // Magic number check
    const magic = view.getUint32(0, true);
    if (magic !== 0xa1b2c3d4 && magic !== 0x70797468) {
      // 如果不是标准 magic，尝试使用偏移量
    }

    // 读取指数 (offset 20)
    const expo = view.getInt32(20, true);
    
    // 读取价格和置信度 (offset varies by version)
    // V2 格式: price at offset 208, conf at offset 216
    let price: bigint;
    let conf: bigint;
    let emaPrice: bigint;
    let emaConf: bigint;
    let publishTime: bigint;

    try {
      // 尝试 V2 格式
      price = view.getBigInt64(208, true);
      conf = view.getBigUint64(216, true);
      emaPrice = view.getBigInt64(72, true);
      emaConf = view.getBigUint64(80, true);
      publishTime = view.getBigInt64(96, true);
    } catch {
      // 回退到基本解析
      price = BigInt(0);
      conf = BigInt(0);
      emaPrice = BigInt(0);
      emaConf = BigInt(0);
      publishTime = BigInt(Date.now() / 1000);
    }

    const scale = Math.pow(10, expo);
    
    return {
      price: Number(price) * scale,
      conf: Number(conf) * scale,
      expo,
      publishTime: Number(publishTime),
      emaPrice: Number(emaPrice) * scale,
      emaConf: Number(emaConf) * scale,
    };
  } catch (error) {
    console.error('Failed to parse Pyth price data:', error);
    return null;
  }
}

/**
 * 获取单个代币价格
 */
export function usePythPrice(symbol: 'SOL' | 'USDC' | 'USDT') {
  const { connection } = useConnection();
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const priceFeedKey = `${symbol}_USD` as keyof typeof PYTH_PRICE_ACCOUNTS;
  const priceAccount = PYTH_PRICE_ACCOUNTS[priceFeedKey];

  const fetchPrice = useCallback(async () => {
    // 检查缓存
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPriceInfo(cached.price);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountInfo = await connection.getAccountInfo(priceAccount);
      
      if (!accountInfo) {
        throw new Error(`Price account not found: ${priceAccount.toBase58()}`);
      }

      const pythData = parsePythPriceData(accountInfo.data);
      
      if (!pythData) {
        // 使用回退价格
        const fallbackPrices: Record<string, number> = {
          SOL: 150,
          USDC: 1,
          USDT: 1,
        };
        
        const fallbackPrice: PriceInfo = {
          price: fallbackPrices[symbol] || 0,
          priceFormatted: `$${fallbackPrices[symbol]?.toFixed(2) || '0'}`,
          confidence: 0,
          publishTime: new Date(),
          emaPrice: fallbackPrices[symbol] || 0,
          isStale: true,
        };
        
        setPriceInfo(fallbackPrice);
        return;
      }

      const now = Date.now() / 1000;
      const isStale = now - pythData.publishTime > 60;

      const info: PriceInfo = {
        price: pythData.price,
        priceFormatted: `$${pythData.price.toFixed(symbol === 'SOL' ? 2 : 4)}`,
        confidence: pythData.conf,
        publishTime: new Date(pythData.publishTime * 1000),
        emaPrice: pythData.emaPrice,
        isStale,
      };

      setPriceInfo(info);
      priceCache.set(symbol, { price: info, timestamp: Date.now() });
    } catch (err) {
      console.error(`Failed to fetch ${symbol} price:`, err);
      setError(err as Error);
      
      // 设置回退价格
      const fallbackPrices: Record<string, number> = {
        SOL: 150,
        USDC: 1,
        USDT: 1,
      };
      
      setPriceInfo({
        price: fallbackPrices[symbol] || 0,
        priceFormatted: `$${fallbackPrices[symbol]?.toFixed(2) || '0'}`,
        confidence: 0,
        publishTime: new Date(),
        emaPrice: fallbackPrices[symbol] || 0,
        isStale: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, priceAccount, symbol]);

  useEffect(() => {
    fetchPrice();
    
    // 每 30 秒刷新一次
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    priceInfo,
    price: priceInfo?.price || 0,
    priceFormatted: priceInfo?.priceFormatted || '$0',
    isLoading,
    error,
    isStale: priceInfo?.isStale || false,
    refetch: fetchPrice,
  };
}

/**
 * 获取 SOL 价格
 */
export function useSolanaPrice() {
  return usePythPrice('SOL');
}

/**
 * 获取多个代币价格
 */
export function usePythPrices() {
  const { connection } = useConnection();
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const symbols = ['SOL', 'USDC', 'USDT'] as const;
      const accounts = symbols.map(s => PYTH_PRICE_ACCOUNTS[`${s}_USD` as keyof typeof PYTH_PRICE_ACCOUNTS]);
      
      const accountInfos = await connection.getMultipleAccountsInfo(accounts);
      
      const newPrices: Record<string, PriceInfo> = {};
      const fallbackPrices: Record<string, number> = {
        SOL: 150,
        USDC: 1,
        USDT: 1,
      };

      symbols.forEach((symbol, index) => {
        const accountInfo = accountInfos[index];
        
        if (accountInfo) {
          const pythData = parsePythPriceData(accountInfo.data);
          
          if (pythData) {
            const now = Date.now() / 1000;
            newPrices[symbol] = {
              price: pythData.price,
              priceFormatted: `$${pythData.price.toFixed(symbol === 'SOL' ? 2 : 4)}`,
              confidence: pythData.conf,
              publishTime: new Date(pythData.publishTime * 1000),
              emaPrice: pythData.emaPrice,
              isStale: now - pythData.publishTime > 60,
            };
            return;
          }
        }
        
        // 使用回退价格
        newPrices[symbol] = {
          price: fallbackPrices[symbol],
          priceFormatted: `$${fallbackPrices[symbol].toFixed(2)}`,
          confidence: 0,
          publishTime: new Date(),
          emaPrice: fallbackPrices[symbol],
          isStale: true,
        };
      });

      setPrices(newPrices);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchAllPrices();
    
    // 每 30 秒刷新
    const interval = setInterval(fetchAllPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchAllPrices]);

  return {
    prices,
    solPrice: prices.SOL?.price || 150,
    usdcPrice: prices.USDC?.price || 1,
    usdtPrice: prices.USDT?.price || 1,
    isLoading,
    error,
    refetch: fetchAllPrices,
  };
}

/**
 * 计算 USD 价值
 */
export function useUsdValue(amount: number, symbol: 'SOL' | 'USDC' | 'USDT') {
  const { price } = usePythPrice(symbol);
  
  const usdValue = useMemo(() => {
    return amount * price;
  }, [amount, price]);

  return {
    usdValue,
    usdValueFormatted: `$${usdValue.toFixed(2)}`,
  };
}

/**
 * Pyth 价格预言机健康检查
 */
export function usePythHealthCheck() {
  const { prices, isLoading, error } = usePythPrices();
  
  const healthStatus = useMemo(() => {
    if (isLoading) return { status: 'loading', message: 'Fetching prices...' };
    if (error) return { status: 'error', message: 'Failed to connect to Pyth' };
    
    const staleCount = Object.values(prices).filter(p => p.isStale).length;
    
    if (staleCount === Object.keys(prices).length) {
      return { status: 'stale', message: 'All prices are stale' };
    }
    
    if (staleCount > 0) {
      return { status: 'partial', message: `${staleCount} price(s) are stale` };
    }
    
    return { status: 'healthy', message: 'All prices are live' };
  }, [prices, isLoading, error]);

  return {
    ...healthStatus,
    isHealthy: healthStatus.status === 'healthy',
    isLoading,
  };
}

// Export types
export type { PriceInfo, PythPriceData };
