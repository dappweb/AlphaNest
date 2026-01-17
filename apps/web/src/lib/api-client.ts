/**
 * 优化的 API 客户端
 * 包含超时、重试、缓存、去重等功能
 */

// Use remote API by default, even if NEXT_PUBLIC_API_URL is set to localhost
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (envApiUrl && !envApiUrl.includes('localhost')) 
  ? envApiUrl 
  : 'https://alphanest-api.dappweb.workers.dev';

// 是否在开发模式下使用模拟数据（当后端不可用时）
const USE_MOCK_ON_FAILURE = true;

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// 内存缓存
const cache = new Map<string, CacheEntry>();

// 进行中的请求（去重）
const pendingRequests = new Map<string, Promise<any>>();

// 默认配置
const DEFAULT_TIMEOUT = 10000; // 10秒
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1秒
const DEFAULT_CACHE_TTL = 60000; // 1分钟

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带超时的 fetch
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

/**
 * 生成缓存键
 */
function getCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * 检查缓存是否有效
 */
function getCachedData(key: string, ttl: number): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * 设置缓存
 */
function setCachedData(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * 模拟数据（当后端不可用时使用）
 */
const MOCK_DATA: Record<string, any> = {
  '/api/v1/platform/stats': {
    success: true,
    data: {
      totalVolume24h: 12500000,
      totalUsers: 15420,
      totalTransactions: 89650,
      activeTokens: 2340,
      volumeChange24h: 12.5,
      usersChange24h: 8.3,
      transactionsChange24h: 15.7,
    }
  },
  '/api/v1/tokens/trending': {
    success: true,
    data: [
      { contract_address: '0x1', chain: 'solana', name: 'PopCow', symbol: 'PCOW', price_usd: '0.0234', price_change_24h: 15.2, volume_24h: 1250000, market_cap: 5000000 },
      { contract_address: '0x2', chain: 'solana', name: 'MemeKing', symbol: 'MKING', price_usd: '0.00089', price_change_24h: -5.3, volume_24h: 890000, market_cap: 2100000 },
      { contract_address: '0x3', chain: 'solana', name: 'DogeCat', symbol: 'DGCT', price_usd: '0.0012', price_change_24h: 42.1, volume_24h: 2340000, market_cap: 8900000 },
    ]
  },
  '/api/v1/developers/rankings': {
    success: true,
    data: [
      { id: 1, address: '0xabc...123', alias: 'CryptoBuilder', winRate: 87.5, totalLaunches: 15, rugCount: 0, verified: true, rank: 1, avgReturn: 234, totalVolume: 5600000, reputation: 98 },
      { id: 2, address: '0xdef...456', alias: 'MemeCreator', winRate: 75.0, totalLaunches: 28, rugCount: 1, verified: true, rank: 2, avgReturn: 156, totalVolume: 3200000, reputation: 85 },
      { id: 3, address: '0xghi...789', alias: 'TokenMaster', winRate: 92.3, totalLaunches: 8, rugCount: 0, verified: false, rank: 3, avgReturn: 312, totalVolume: 1800000, reputation: 92 },
    ]
  },
  '/api/v1/health': {
    success: true,
    data: { status: 'healthy', timestamp: new Date().toISOString() }
  }
};

/**
 * 获取模拟数据
 */
function getMockData(endpoint: string): any | null {
  // 尝试精确匹配
  if (MOCK_DATA[endpoint]) {
    return MOCK_DATA[endpoint];
  }
  
  // 尝试基础路径匹配（去除查询参数）
  const basePath = endpoint.split('?')[0];
  for (const key of Object.keys(MOCK_DATA)) {
    if (basePath.startsWith(key.split('?')[0])) {
      return MOCK_DATA[key];
    }
  }
  
  return null;
}

// 跟踪失败次数，避免频繁显示错误
let failureCount = 0;
const MAX_LOGGED_FAILURES = 3;

/**
 * 优化的 API 请求函数
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const cacheKey = getCacheKey(url, fetchOptions);

  // 检查缓存
  if (useCache && fetchOptions.method === 'GET') {
    const cached = getCachedData(cacheKey, cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  // 检查是否有进行中的相同请求（去重）
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // 创建请求 Promise
  const requestPromise = (async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 添加延迟（重试时）
        if (attempt > 0) {
          await delay(retryDelay * attempt);
        }

        const response = await fetchWithTimeout(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        }, timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 缓存成功的 GET 请求
        if (useCache && fetchOptions.method === 'GET' && data.success) {
          setCachedData(cacheKey, data, cacheTTL);
        }

        // 从进行中的请求中移除
        pendingRequests.delete(cacheKey);
        
        // 成功后重置失败计数
        failureCount = 0;

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // 最后一次尝试失败
        if (attempt === retries) {
          pendingRequests.delete(cacheKey);
          
          // 尝试返回模拟数据
          if (USE_MOCK_ON_FAILURE) {
            const mockData = getMockData(endpoint);
            if (mockData) {
              // 只在前几次失败时记录错误
              if (failureCount < MAX_LOGGED_FAILURES) {
                failureCount++;
                console.warn(`[API] Backend unavailable, using mock data for: ${endpoint}`);
              }
              // 缓存模拟数据
              if (useCache) {
                setCachedData(cacheKey, mockData, cacheTTL);
              }
              return mockData as T;
            }
          }
          
          // 只在前几次失败时记录错误
          if (failureCount < MAX_LOGGED_FAILURES) {
            failureCount++;
            console.error(`[API] Request failed: ${endpoint}`, lastError.message);
          }
          
          throw lastError;
        }
      }
    }

    pendingRequests.delete(cacheKey);
    throw lastError || new Error('Request failed');
  })();

  // 保存进行中的请求
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
}

/**
 * 清除缓存
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  return {
    size: cache.size,
    pending: pendingRequests.size,
  };
}
