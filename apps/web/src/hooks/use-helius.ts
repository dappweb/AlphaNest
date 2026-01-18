/**
 * Helius API Hook
 * 提供 Solana 代币价格、余额、交易历史等功能
 * https://docs.helius.dev/
 * 
 * 优化: 使用内存缓存减少重复请求
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  HELIUS_API_KEY, 
  getHeliusConfig,
  type HeliusTokenBalance,
  type HeliusTokenMetadata,
  type HeliusTransaction,
  type HeliusAsset,
  type HeliusPriceData,
} from '@/config/helius';
import { SOLANA_TOKENS, SOLANA_TOKEN_DECIMALS } from '@/config/solana';
import { memoryCache, CACHE_TTL } from '@/lib/cache';

// 网络配置
const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' ? 'mainnet' : 'devnet') as 'mainnet' | 'devnet';
const config = getHeliusConfig(NETWORK);

// ============================================
// API 请求工具
// ============================================

async function heliusRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${config.apiUrl}${endpoint}?api-key=${HELIUS_API_KEY}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Helius API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function heliusRpcRequest<T>(method: string, params: any[]): Promise<T> {
  const response = await fetch(config.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'helius-request',
      method,
      params,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Helius RPC Error: ${data.error.message}`);
  }
  return data.result;
}

// ============================================
// 代币价格 Hook
// ============================================

interface TokenPriceResult {
  price: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: Date;
}

export function useHeliusTokenPrice(mintAddress: string) {
  const [price, setPrice] = useState<TokenPriceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchPrice = useCallback(async (force = false) => {
    if (!mintAddress || !HELIUS_API_KEY) return;

    // 防抖 - 最小间隔 5 秒
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;

    // 检查缓存
    const cacheKey = `price:${mintAddress}`;
    const cached = memoryCache.get<TokenPriceResult>(cacheKey);
    if (cached && !force) {
      setPrice(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 使用 Jupiter Price API (通过 Helius)
      const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${mintAddress}`
      );
      const data = await response.json();
      
      if (data.data && data.data[mintAddress]) {
        const tokenData = data.data[mintAddress];
        const priceResult: TokenPriceResult = {
          price: tokenData.price || 0,
          priceChange24h: tokenData.priceChange24h,
          volume24h: tokenData.volume24h,
          marketCap: tokenData.marketCap,
          lastUpdated: new Date(),
        };
        setPrice(priceResult);
        memoryCache.set(cacheKey, priceResult, CACHE_TTL.PRICE);
      } else {
        // 尝试使用 DAS API 获取价格
        const dasResponse = await heliusRpcRequest<any>('getAsset', [mintAddress]);
        if (dasResponse?.token_info?.price_info) {
          const priceResult: TokenPriceResult = {
            price: dasResponse.token_info.price_info.price_per_token || 0,
            lastUpdated: new Date(),
          };
          setPrice(priceResult);
          memoryCache.set(cacheKey, priceResult, CACHE_TTL.PRICE);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch price'));
    } finally {
      setIsLoading(false);
    }
  }, [mintAddress]);

  useEffect(() => {
    fetchPrice();
    // 每 30 秒刷新一次
    const interval = setInterval(() => fetchPrice(true), 30000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, isLoading, error, refetch: () => fetchPrice(true) };
}

// 批量获取代币价格
export function useHeliusTokenPrices(mintAddresses: string[]) {
  const [prices, setPrices] = useState<Record<string, TokenPriceResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!mintAddresses.length || !HELIUS_API_KEY) return;

    setIsLoading(true);
    setError(null);

    try {
      const ids = mintAddresses.join(',');
      const response = await fetch(`https://price.jup.ag/v6/price?ids=${ids}`);
      const data = await response.json();

      const newPrices: Record<string, TokenPriceResult> = {};
      for (const mint of mintAddresses) {
        if (data.data && data.data[mint]) {
          const tokenData = data.data[mint];
          newPrices[mint] = {
            price: tokenData.price || 0,
            priceChange24h: tokenData.priceChange24h,
            volume24h: tokenData.volume24h,
            marketCap: tokenData.marketCap,
            lastUpdated: new Date(),
          };
        }
      }
      setPrices(newPrices);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch prices'));
    } finally {
      setIsLoading(false);
    }
  }, [mintAddresses]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, isLoading, error, refetch: fetchPrices };
}

// ============================================
// 代币余额 Hook
// ============================================

export function useHeliusTokenBalances(walletAddress: string | undefined) {
  const [balances, setBalances] = useState<HeliusTokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchBalances = useCallback(async (force = false) => {
    if (!walletAddress || !HELIUS_API_KEY) return;

    // 防抖 - 最小间隔 10 秒
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 10000) return;
    lastFetchRef.current = now;

    // 检查缓存
    const cacheKey = `balances:${walletAddress}`;
    const cached = memoryCache.get<HeliusTokenBalance[]>(cacheKey);
    if (cached && !force) {
      setBalances(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 使用 DAS API 获取所有代币余额
      const response = await heliusRpcRequest<any>('getAssetsByOwner', [{
        ownerAddress: walletAddress,
        page: 1,
        limit: 100,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
        },
      }]);

      const tokenBalances: HeliusTokenBalance[] = [];

      // 处理原生 SOL 余额
      if (response.nativeBalance) {
        tokenBalances.push({
          mint: SOLANA_TOKENS.SOL,
          amount: response.nativeBalance.lamports / 1e9,
          decimals: 9,
          tokenAccount: walletAddress,
        });
      }

      // 处理 SPL 代币
      if (response.items) {
        for (const item of response.items) {
          if (item.interface === 'FungibleToken' && item.token_info) {
            tokenBalances.push({
              mint: item.id,
              amount: item.token_info.balance / Math.pow(10, item.token_info.decimals),
              decimals: item.token_info.decimals,
              tokenAccount: item.token_info.associated_token_address || item.id,
            });
          }
        }
      }

      setBalances(tokenBalances);
      memoryCache.set(cacheKey, tokenBalances, CACHE_TTL.BALANCE);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balances'));
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // 获取特定代币余额
  const getBalance = useCallback((mint: string) => {
    return balances.find(b => b.mint === mint)?.amount || 0;
  }, [balances]);

  // SOL 余额
  const solBalance = useMemo(() => getBalance(SOLANA_TOKENS.SOL), [getBalance]);

  return { balances, solBalance, getBalance, isLoading, error, refetch: () => fetchBalances(true) };
}

// ============================================
// 代币元数据 Hook
// ============================================

export function useHeliusTokenMetadata(mintAddress: string | undefined) {
  const [metadata, setMetadata] = useState<HeliusTokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!mintAddress || !HELIUS_API_KEY) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await heliusRpcRequest<HeliusAsset>('getAsset', [mintAddress]);
      
      if (response) {
        setMetadata({
          mint: response.id,
          name: response.content?.metadata?.name || 'Unknown',
          symbol: response.content?.metadata?.symbol || '???',
          uri: response.content?.json_uri || '',
          image: response.content?.links?.image,
          description: response.content?.metadata?.description,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metadata'));
    } finally {
      setIsLoading(false);
    }
  }, [mintAddress]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return { metadata, isLoading, error, refetch: fetchMetadata };
}

// ============================================
// 交易历史 Hook
// ============================================

export function useHeliusTransactionHistory(
  walletAddress: string | undefined,
  options?: {
    limit?: number;
    type?: string;
  }
) {
  const [transactions, setTransactions] = useState<HeliusTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress || !HELIUS_API_KEY) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        'api-key': HELIUS_API_KEY,
      });

      const url = `${config.apiUrl}/addresses/${walletAddress}/transactions?${params}`;
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        const filtered = options?.type
          ? data.filter((tx: HeliusTransaction) => tx.type === options.type)
          : data;
        setTransactions(filtered.slice(0, options?.limit || 50));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, options?.limit, options?.type]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}

// ============================================
// 资产搜索 Hook (DAS API)
// ============================================

export function useHeliusAssetSearch(query: string) {
  const [assets, setAssets] = useState<HeliusAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async () => {
    if (!query || query.length < 2 || !HELIUS_API_KEY) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await heliusRpcRequest<any>('searchAssets', [{
        ownerAddress: query,
        page: 1,
        limit: 20,
      }]);

      if (response?.items) {
        setAssets(response.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timer);
  }, [search]);

  return { assets, isLoading, error, search };
}

// ============================================
// pump.fun 代币 Hook
// ============================================

interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  holders?: number;
  createdAt?: Date;
}

export function useHeliusPumpFunTokens(walletAddress?: string) {
  const [tokens, setTokens] = useState<PumpFunToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!HELIUS_API_KEY) return;

    setIsLoading(true);
    setError(null);

    try {
      // 获取用户持有的 pump.fun 代币
      if (walletAddress) {
        const response = await heliusRpcRequest<any>('getAssetsByOwner', [{
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
          displayOptions: {
            showFungible: true,
          },
        }]);

        if (response?.items) {
          const pumpTokens = response.items
            .filter((item: any) => 
              item.id?.endsWith('pump') || 
              item.content?.metadata?.symbol?.includes('pump')
            )
            .map((item: any) => ({
              mint: item.id,
              name: item.content?.metadata?.name || 'Unknown',
              symbol: item.content?.metadata?.symbol || '???',
              description: item.content?.metadata?.description,
              image: item.content?.links?.image,
              price: item.token_info?.price_info?.price_per_token,
              marketCap: item.token_info?.supply 
                ? (item.token_info.price_info?.price_per_token || 0) * item.token_info.supply / Math.pow(10, item.token_info.decimals)
                : undefined,
            }));
          setTokens(pumpTokens);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pump.fun tokens'));
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}

// ============================================
// Webhook 管理
// ============================================

export function useHeliusWebhooks() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    if (!HELIUS_API_KEY) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.webhooksUrl}?api-key=${HELIUS_API_KEY}`
      );
      const data = await response.json();
      setWebhooks(data || []);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWebhook = useCallback(async (
    webhookURL: string,
    accountAddresses: string[],
    transactionTypes: string[] = ['Any']
  ) => {
    if (!HELIUS_API_KEY) return null;

    try {
      const response = await fetch(
        `${config.webhooksUrl}?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookURL,
            transactionTypes,
            accountAddresses,
            webhookType: 'enhanced',
          }),
        }
      );
      const data = await response.json();
      await fetchWebhooks();
      return data;
    } catch (err) {
      console.error('Failed to create webhook:', err);
      return null;
    }
  }, [fetchWebhooks]);

  const deleteWebhook = useCallback(async (webhookID: string) => {
    if (!HELIUS_API_KEY) return false;

    try {
      await fetch(
        `${config.webhooksUrl}/${webhookID}?api-key=${HELIUS_API_KEY}`,
        { method: 'DELETE' }
      );
      await fetchWebhooks();
      return true;
    } catch (err) {
      console.error('Failed to delete webhook:', err);
      return false;
    }
  }, [fetchWebhooks]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return { webhooks, isLoading, createWebhook, deleteWebhook, refetch: fetchWebhooks };
}

// ============================================
// 组合 Hook - 完整的 Helius 功能
// ============================================

export function useHelius(walletAddress?: string) {
  const balances = useHeliusTokenBalances(walletAddress);
  const transactions = useHeliusTransactionHistory(walletAddress, { limit: 20 });
  const pumpFunTokens = useHeliusPumpFunTokens(walletAddress);

  // 常用代币价格
  const commonMints = [
    SOLANA_TOKENS.SOL,
    SOLANA_TOKENS.USDC,
    SOLANA_TOKENS.BONK,
    SOLANA_TOKENS.WIF,
    SOLANA_TOKENS.POPCOW_DEFI,
  ];
  const prices = useHeliusTokenPrices(commonMints);

  return {
    // 余额
    balances: balances.balances,
    solBalance: balances.solBalance,
    getBalance: balances.getBalance,
    
    // 价格
    prices: prices.prices,
    getPrice: (mint: string) => prices.prices[mint]?.price || 0,
    
    // 交易历史
    transactions: transactions.transactions,
    
    // pump.fun 代币
    pumpFunTokens: pumpFunTokens.tokens,
    
    // 加载状态
    isLoading: balances.isLoading || transactions.isLoading || prices.isLoading,
    
    // 刷新
    refetch: () => {
      balances.refetch();
      transactions.refetch();
      prices.refetch();
      pumpFunTokens.refetch();
    },
  };
}

// 导出配置
export { HELIUS_API_KEY, config as heliusConfig };
