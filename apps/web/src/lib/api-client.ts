/**
 * 优化的 API 客户端
 * 包含超时、重试、缓存、去重等功能
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

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

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // 最后一次尝试失败
        if (attempt === retries) {
          pendingRequests.delete(cacheKey);
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
