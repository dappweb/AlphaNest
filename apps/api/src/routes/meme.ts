/**
 * Meme 平台聚合 API 路由
 * 整合 Pump.fun, GMGN.ai, Birdeye, DexScreener 数据
 */

import { Hono } from 'hono';
import {
  getPumpFunNewTokens,
  getPumpFunTrending,
  getPumpFunTokenDetail,
  searchPumpFunTokens,
  getGMGNTrending,
  getGMGNNewTokens,
  getGMGNSmartMoneyTrades,
  getGMGNTopTraders,
  getBirdeyeTrending,
  getBirdeyeTokenDetail,
  getBirdeyePriceHistory,
  getBirdeyeOHLCV,
  getDexScreenerTrending,
  getDexScreenerBoosted,
  aggregateAllPlatforms,
  MemeToken,
} from '../services/meme-platforms';

const app = new Hono();

// ============================================
// 聚合端点
// ============================================

/**
 * GET /aggregate
 * 聚合所有平台数据
 */
app.get('/aggregate', async (c) => {
  const chain = c.req.query('chain') || 'solana';
  
  // 缓存 key
  const cacheKey = `meme:aggregate:${chain}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const data = await aggregateAllPlatforms(chain, {
      birdeyeApiKey: c.env.BIRDEYE_API_KEY,
    });
    
    // 缓存 1 分钟
    await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error('Aggregate error:', error);
    return c.json({
      success: false,
      error: { code: 'AGGREGATE_ERROR', message: 'Failed to aggregate data' },
    }, 500);
  }
});

/**
 * GET /trending
 * 热门 Meme 代币 (聚合所有来源)
 */
app.get('/trending', async (c) => {
  const chain = c.req.query('chain') || 'solana';
  const source = c.req.query('source'); // pumpfun, gmgn, birdeye, dexscreener, all
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `meme:trending:${chain}:${source || 'all'}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    let tokens: MemeToken[] = [];
    
    if (!source || source === 'all') {
      // 聚合所有来源
      const [pumpfun, gmgn, birdeye, dexscreener] = await Promise.allSettled([
        chain === 'solana' ? getPumpFunTrending(limit) : Promise.resolve([]),
        getGMGNTrending(chain === 'solana' ? 'sol' : chain, limit),
        chain === 'solana' ? getBirdeyeTrending({ apiKey: c.env.BIRDEYE_API_KEY }, limit) : Promise.resolve([]),
        getDexScreenerTrending(chain, limit),
      ]);
      
      if (pumpfun.status === 'fulfilled') tokens.push(...pumpfun.value);
      if (gmgn.status === 'fulfilled') tokens.push(...gmgn.value);
      if (birdeye.status === 'fulfilled') tokens.push(...birdeye.value);
      if (dexscreener.status === 'fulfilled') tokens.push(...dexscreener.value);
      
      // 去重
      const seen = new Set<string>();
      tokens = tokens.filter(t => {
        if (seen.has(t.address)) return false;
        seen.add(t.address);
        return true;
      });
      
      // 按市值排序
      tokens.sort((a, b) => parseFloat(b.marketCap || '0') - parseFloat(a.marketCap || '0'));
    } else {
      // 单一来源
      switch (source) {
        case 'pumpfun':
          tokens = await getPumpFunTrending(limit);
          break;
        case 'gmgn':
          tokens = await getGMGNTrending(chain === 'solana' ? 'sol' : chain, limit);
          break;
        case 'birdeye':
          tokens = await getBirdeyeTrending({ apiKey: c.env.BIRDEYE_API_KEY }, limit);
          break;
        case 'dexscreener':
          tokens = await getDexScreenerTrending(chain, limit);
          break;
      }
    }
    
    tokens = tokens.slice(0, limit);
    
    // 缓存 1 分钟
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 60 });
    
    return c.json({ success: true, data: tokens, count: tokens.length });
  } catch (error) {
    console.error('Trending error:', error);
    return c.json({
      success: false,
      error: { code: 'TRENDING_ERROR', message: 'Failed to fetch trending' },
    }, 500);
  }
});

/**
 * GET /new
 * 新发射的 Meme 代币
 */
app.get('/new', async (c) => {
  const chain = c.req.query('chain') || 'solana';
  const source = c.req.query('source');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `meme:new:${chain}:${source || 'all'}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    let tokens: MemeToken[] = [];
    
    if (!source || source === 'all') {
      const [pumpfun, gmgn] = await Promise.allSettled([
        chain === 'solana' ? getPumpFunNewTokens(limit) : Promise.resolve([]),
        getGMGNNewTokens(chain === 'solana' ? 'sol' : chain, limit),
      ]);
      
      if (pumpfun.status === 'fulfilled') tokens.push(...pumpfun.value);
      if (gmgn.status === 'fulfilled') tokens.push(...gmgn.value);
      
      // 去重并按时间排序
      const seen = new Set<string>();
      tokens = tokens
        .filter(t => {
          if (seen.has(t.address)) return false;
          seen.add(t.address);
          return true;
        })
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      switch (source) {
        case 'pumpfun':
          tokens = await getPumpFunNewTokens(limit);
          break;
        case 'gmgn':
          tokens = await getGMGNNewTokens(chain === 'solana' ? 'sol' : chain, limit);
          break;
      }
    }
    
    tokens = tokens.slice(0, limit);
    
    // 缓存 30 秒
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 30 });
    
    return c.json({ success: true, data: tokens, count: tokens.length });
  } catch (error) {
    console.error('New tokens error:', error);
    return c.json({
      success: false,
      error: { code: 'NEW_ERROR', message: 'Failed to fetch new tokens' },
    }, 500);
  }
});

// ============================================
// Pump.fun 端点
// ============================================

/**
 * GET /pumpfun/trending
 * Pump.fun 热门代币
 */
app.get('/pumpfun/trending', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `pumpfun:trending:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const tokens = await getPumpFunTrending(limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 60 });
    
    return c.json({ success: true, data: tokens, source: 'pump.fun' });
  } catch (error) {
    console.error('Pump.fun trending error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /pumpfun/new
 * Pump.fun 新代币
 */
app.get('/pumpfun/new', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `pumpfun:new:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const tokens = await getPumpFunNewTokens(limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 30 });
    
    return c.json({ success: true, data: tokens, source: 'pump.fun' });
  } catch (error) {
    console.error('Pump.fun new error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /pumpfun/token/:mint
 * Pump.fun 代币详情
 */
app.get('/pumpfun/token/:mint', async (c) => {
  const mint = c.req.param('mint');
  
  try {
    const token = await getPumpFunTokenDetail(mint);
    
    if (!token) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Token not found' },
      }, 404);
    }
    
    return c.json({ success: true, data: token, source: 'pump.fun' });
  } catch (error) {
    console.error('Pump.fun token error:', error);
    return c.json({
      success: false,
      error: { code: 'API_ERROR', message: 'Failed to fetch token' },
    }, 500);
  }
});

/**
 * GET /pumpfun/search
 * Pump.fun 搜索
 */
app.get('/pumpfun/search', async (c) => {
  const query = c.req.query('q');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
  
  if (!query || query.length < 2) {
    return c.json({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' },
    }, 400);
  }
  
  try {
    const tokens = await searchPumpFunTokens(query, limit);
    return c.json({ success: true, data: tokens, source: 'pump.fun' });
  } catch (error) {
    console.error('Pump.fun search error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

// ============================================
// GMGN 端点
// ============================================

/**
 * GET /gmgn/trending
 * GMGN 热门代币
 */
app.get('/gmgn/trending', async (c) => {
  const chain = c.req.query('chain') || 'sol';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `gmgn:trending:${chain}:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const tokens = await getGMGNTrending(chain, limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 60 });
    
    return c.json({ success: true, data: tokens, source: 'gmgn' });
  } catch (error) {
    console.error('GMGN trending error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /gmgn/smart-money
 * GMGN 聪明钱交易
 */
app.get('/gmgn/smart-money', async (c) => {
  const chain = c.req.query('chain') || 'sol';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `gmgn:smartmoney:${chain}:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const trades = await getGMGNSmartMoneyTrades(chain, limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(trades), { expirationTtl: 30 });
    
    return c.json({ success: true, data: trades, source: 'gmgn' });
  } catch (error) {
    console.error('GMGN smart money error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /gmgn/top-traders
 * GMGN 顶级交易员
 */
app.get('/gmgn/top-traders', async (c) => {
  const chain = c.req.query('chain') || 'sol';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `gmgn:toptraders:${chain}:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const traders = await getGMGNTopTraders(chain, limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(traders), { expirationTtl: 120 });
    
    return c.json({ success: true, data: traders, source: 'gmgn' });
  } catch (error) {
    console.error('GMGN top traders error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

// ============================================
// Birdeye 端点
// ============================================

/**
 * GET /birdeye/trending
 * Birdeye 热门代币
 */
app.get('/birdeye/trending', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `birdeye:trending:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const tokens = await getBirdeyeTrending({ apiKey: c.env.BIRDEYE_API_KEY }, limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 60 });
    
    return c.json({ success: true, data: tokens, source: 'birdeye' });
  } catch (error) {
    console.error('Birdeye trending error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /birdeye/token/:address
 * Birdeye 代币详情
 */
app.get('/birdeye/token/:address', async (c) => {
  const address = c.req.param('address');
  
  try {
    const token = await getBirdeyeTokenDetail(address, { apiKey: c.env.BIRDEYE_API_KEY });
    
    if (!token) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Token not found' },
      }, 404);
    }
    
    return c.json({ success: true, data: token, source: 'birdeye' });
  } catch (error) {
    console.error('Birdeye token error:', error);
    return c.json({
      success: false,
      error: { code: 'API_ERROR', message: 'Failed to fetch token' },
    }, 500);
  }
});

/**
 * GET /birdeye/ohlcv/:address
 * Birdeye OHLCV K线数据
 */
app.get('/birdeye/ohlcv/:address', async (c) => {
  const address = c.req.param('address');
  const timeframe = (c.req.query('timeframe') || '1h') as any;
  
  try {
    const ohlcv = await getBirdeyeOHLCV(address, timeframe, { apiKey: c.env.BIRDEYE_API_KEY });
    
    return c.json({ success: true, data: ohlcv, source: 'birdeye' });
  } catch (error) {
    console.error('Birdeye OHLCV error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

// ============================================
// DexScreener 端点
// ============================================

/**
 * GET /dexscreener/trending
 * DexScreener 热门代币
 */
app.get('/dexscreener/trending', async (c) => {
  const chain = c.req.query('chain');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `dexscreener:trending:${chain || 'all'}:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const tokens = await getDexScreenerTrending(chain, limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 60 });
    
    return c.json({ success: true, data: tokens, source: 'dexscreener' });
  } catch (error) {
    console.error('DexScreener trending error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /dexscreener/boosted
 * DexScreener 推广代币
 */
app.get('/dexscreener/boosted', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const cacheKey = `dexscreener:boosted:${limit}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
  
  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }
  
  try {
    const tokens = await getDexScreenerBoosted(limit);
    
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 300 });
    
    return c.json({ success: true, data: tokens, source: 'dexscreener' });
  } catch (error) {
    console.error('DexScreener boosted error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

export { app as memeRoutes };
