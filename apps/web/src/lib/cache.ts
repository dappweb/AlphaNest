/**
 * 客户端缓存工具
 * 优化 API 请求，减少重复加载
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100;

  /**
   * 获取缓存数据
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * 设置缓存数据
   */
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    // 清理过期缓存
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
}

// 全局缓存实例
export const memoryCache = new MemoryCache();

/**
 * 带缓存的 fetch 请求
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { 
    cacheTtl?: number; 
    cacheKey?: string;
    skipCache?: boolean;
  }
): Promise<T> {
  const { cacheTtl = 30000, cacheKey, skipCache = false, ...fetchOptions } = options || {};
  const key = cacheKey || url;

  // 尝试从缓存获取
  if (!skipCache) {
    const cached = memoryCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // 发起请求
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // 存入缓存
  memoryCache.set(key, data, cacheTtl);
  
  return data;
}

/**
 * 请求去重 - 防止重复请求
 */
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const key = `${options?.method || 'GET'}:${url}`;
  
  // 如果已有相同请求在进行中，返回该请求的 Promise
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // 创建新请求
  const request = fetch(url, options)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}

/**
 * 批量请求 - 合并多个请求
 */
export async function batchFetch<T>(
  urls: string[],
  options?: RequestInit
): Promise<T[]> {
  return Promise.all(
    urls.map(url => cachedFetch<T>(url, options))
  );
}

/**
 * 带重试的请求
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit & { 
    retries?: number; 
    retryDelay?: number;
  }
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options || {};
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, retryDelay * (i + 1)));
    }
  }
  
  throw new Error('Max retries reached');
}

/**
 * SWR 模式 - 先返回缓存，后台更新
 */
export function useSWRFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    onUpdate?: (data: T) => void;
  }
): { data: T | null; isLoading: boolean; isValidating: boolean } {
  const cached = memoryCache.get<T>(key);
  
  // 后台更新
  fetcher().then(data => {
    memoryCache.set(key, data, options?.ttl || 30000);
    options?.onUpdate?.(data);
  }).catch(console.error);

  return {
    data: cached,
    isLoading: cached === null,
    isValidating: true,
  };
}

// 预定义的缓存 TTL
export const CACHE_TTL = {
  SHORT: 10 * 1000,      // 10 秒
  MEDIUM: 30 * 1000,     // 30 秒
  LONG: 5 * 60 * 1000,   // 5 分钟
  VERY_LONG: 30 * 60 * 1000, // 30 分钟
  PRICE: 15 * 1000,      // 价格 15 秒
  BALANCE: 30 * 1000,    // 余额 30 秒
  METADATA: 60 * 60 * 1000, // 元数据 1 小时
};
