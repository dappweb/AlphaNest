/**
 * 地理围栏中间件
 * 阻止受限地区访问敏感功能
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

// 受限国家/地区代码 (ISO 3166-1 alpha-2)
const BLOCKED_COUNTRIES = new Set([
  'US',  // 美国
  'CN',  // 中国大陆
  'KP',  // 朝鲜
  'IR',  // 伊朗
  'CU',  // 古巴
  'SY',  // 叙利亚
]);

// 豁免路径 (公开信息类接口)
const EXEMPT_PATHS = [
  '/api/v1/tokens/trending',
  '/api/v1/dev/leaderboard',
  '/api/v1/dev/',
  '/health',
  '/',
];

export function geoBlockMiddleware() {
  return async (c: Context, next: Next) => {
    // 检查是否为豁免路径
    const path = c.req.path;
    if (EXEMPT_PATHS.some(p => path.startsWith(p))) {
      return next();
    }

    // 获取 Cloudflare 提供的地理位置信息
    const country = c.req.header('CF-IPCountry');

    if (country && BLOCKED_COUNTRIES.has(country)) {
      console.log(`Blocked request from ${country}: ${path}`);

      throw new HTTPException(451, {
        message: 'Service not available in your region',
      });
    }

    await next();
  };
}

/**
 * 严格地理围栏 (用于交易、保险等高风险功能)
 */
export function strictGeoBlockMiddleware() {
  return async (c: Context, next: Next) => {
    const country = c.req.header('CF-IPCountry');

    if (!country) {
      // 无法确定地区时拒绝访问
      throw new HTTPException(403, {
        message: 'Unable to verify your location',
      });
    }

    if (BLOCKED_COUNTRIES.has(country)) {
      throw new HTTPException(451, {
        message: 'This feature is not available in your region due to regulatory requirements',
      });
    }

    await next();
  };
}
