/**
 * Rate Limiting 中间件
 * 基于 Cloudflare KV 的分布式限流
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface RateLimitConfig {
  requests: number;  // 请求数限制
  window: number;    // 时间窗口 (秒)
}

const DEFAULT_CONFIG: RateLimitConfig = {
  requests: 100,
  window: 60,
};

export function rateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const { requests, window } = { ...DEFAULT_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    // 获取客户端标识 (优先使用 CF-Connecting-IP)
    const clientIP = c.req.header('CF-Connecting-IP') ||
                     c.req.header('X-Forwarded-For')?.split(',')[0] ||
                     'unknown';

    // 已认证用户使用 user_id 作为限流 key
    const user = c.get('user');
    const identifier = user?.id || `ip:${clientIP}`;

    const key = `rate_limit:${identifier}`;

    try {
      // 获取当前计数
      const data = await c.env.RATE_LIMIT.get(key, { type: 'json' }) as {
        count: number;
        resetAt: number;
      } | null;

      const now = Date.now();

      if (data && data.resetAt > now) {
        // 在时间窗口内
        if (data.count >= requests) {
          // 超过限制
          const retryAfter = Math.ceil((data.resetAt - now) / 1000);

          c.header('X-RateLimit-Limit', requests.toString());
          c.header('X-RateLimit-Remaining', '0');
          c.header('X-RateLimit-Reset', Math.ceil(data.resetAt / 1000).toString());
          c.header('Retry-After', retryAfter.toString());

          throw new HTTPException(429, {
            message: `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
          });
        }

        // 增加计数
        await c.env.RATE_LIMIT.put(key, JSON.stringify({
          count: data.count + 1,
          resetAt: data.resetAt,
        }), {
          expirationTtl: window,
        });

        c.header('X-RateLimit-Limit', requests.toString());
        c.header('X-RateLimit-Remaining', (requests - data.count - 1).toString());
        c.header('X-RateLimit-Reset', Math.ceil(data.resetAt / 1000).toString());
      } else {
        // 新的时间窗口
        const resetAt = now + window * 1000;

        await c.env.RATE_LIMIT.put(key, JSON.stringify({
          count: 1,
          resetAt,
        }), {
          expirationTtl: window,
        });

        c.header('X-RateLimit-Limit', requests.toString());
        c.header('X-RateLimit-Remaining', (requests - 1).toString());
        c.header('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
      }

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      // KV 错误时放行请求，避免影响服务
      console.error('Rate limit error:', error);
      await next();
    }
  };
}

/**
 * 自定义端点限流配置
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 严格限流端点
  '/api/v1/trade/execute': { requests: 10, window: 60 },
  '/api/v1/insurance/purchase': { requests: 5, window: 60 },
  '/api/v1/user/connect': { requests: 10, window: 60 },

  // 宽松限流端点
  '/api/v1/tokens/trending': { requests: 300, window: 60 },
  '/api/v1/dev/leaderboard': { requests: 300, window: 60 },
};

/**
 * 按端点应用不同限流策略
 */
export function dynamicRateLimitMiddleware() {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const config = RATE_LIMIT_CONFIGS[path] || DEFAULT_CONFIG;

    return rateLimitMiddleware(config)(c, next);
  };
}
