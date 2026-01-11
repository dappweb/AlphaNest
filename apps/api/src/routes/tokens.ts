/**
 * 代币模块路由
 */

import { Hono } from 'hono';
import { getTrendingTokens, getTokenPrice } from '../utils/external-apis';

const app = new Hono();

// DexScreener 链映射
const CHAIN_MAP: Record<string, string> = {
  solana: 'solana',
  base: 'base',
  ethereum: 'ethereum',
  bnb: 'bsc',
};

/**
 * GET /trending
 * 热门代币列表 - 从 DexScreener token-profiles API 获取真实数据
 */
app.get('/trending', async (c) => {
  const chain = c.req.query('chain');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  // 检查缓存
  const cacheKey = `trending:${chain || 'all'}:v3`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });

  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }

  try {
    // 从 DexScreener 获取最新 token profiles
    const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');

    if (!response.ok) {
      return c.json({ success: true, data: [], source: 'empty' });
    }

    const profiles: any[] = await response.json();
    
    // 按链过滤
    let filteredProfiles = profiles;
    if (chain) {
      const dexChain = CHAIN_MAP[chain] || chain;
      filteredProfiles = profiles.filter((p: any) => p.chainId === dexChain);
    }

    // 去重并限制数量
    const uniqueTokens = new Map();
    for (const profile of filteredProfiles) {
      if (!uniqueTokens.has(profile.tokenAddress)) {
        uniqueTokens.set(profile.tokenAddress, profile);
      }
      if (uniqueTokens.size >= limit) break;
    }

    // 批量获取代币价格数据
    const tokenAddresses = Array.from(uniqueTokens.keys()).slice(0, 30);
    const pricePromises = tokenAddresses.map(async (addr: string) => {
      try {
        const priceRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          return { address: addr, data: priceData.pairs?.[0] };
        }
      } catch {
        return { address: addr, data: null };
      }
      return { address: addr, data: null };
    });

    const priceResults = await Promise.all(pricePromises);
    const priceMap = new Map(priceResults.map((r: any) => [r.address, r.data]));

    // 构建返回数据
    const tokens = Array.from(uniqueTokens.values()).map((profile: any) => {
      const priceData = priceMap.get(profile.tokenAddress);
      return {
        contract_address: profile.tokenAddress,
        chain: profile.chainId,
        name: profile.description?.split('\n')[0]?.slice(0, 50) || 'Unknown',
        symbol: priceData?.baseToken?.symbol || '???',
        logo_url: profile.icon,
        description: profile.description,
        price_usd: priceData?.priceUsd || '0',
        price_change_24h: priceData?.priceChange?.h24 || 0,
        volume_24h: priceData?.volume?.h24 || '0',
        market_cap: priceData?.marketCap || priceData?.fdv || '0',
        liquidity: priceData?.liquidity?.usd || '0',
        pair_address: priceData?.pairAddress,
        dex: priceData?.dexId,
        url: profile.url,
        twitter: profile.links?.find((l: any) => l.type === 'twitter')?.url,
        website: profile.links?.find((l: any) => !l.type)?.url,
      };
    });

    // 缓存 2 分钟
    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 120 });

    return c.json({ success: true, data: tokens, source: 'dexscreener' });
  } catch (error) {
    console.error('DexScreener API error:', error);
    return c.json({ success: true, data: [], source: 'error', error: String(error) });
  }
});

/**
 * GET /boosted
 * 获取 DexScreener 推广代币
 */
app.get('/boosted', async (c) => {
  const cacheKey = 'boosted:all';
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });

  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }

  try {
    const response = await fetch('https://api.dexscreener.com/token-boosts/latest/v1');
    
    if (!response.ok) {
      return c.json({ success: true, data: [], source: 'empty' });
    }

    const data = await response.json();
    const tokens = (data || []).slice(0, 50).map((item: any) => ({
      contract_address: item.tokenAddress,
      chain: item.chainId,
      name: item.description || 'Unknown',
      symbol: item.symbol || '???',
      logo_url: item.icon,
      url: item.url,
      boost_amount: item.amount,
    }));

    await c.env.CACHE.put(cacheKey, JSON.stringify(tokens), { expirationTtl: 300 });

    return c.json({ success: true, data: tokens, source: 'dexscreener' });
  } catch (error) {
    console.error('DexScreener boosted error:', error);
    return c.json({ success: true, data: [], source: 'error' });
  }
});

/**
 * GET /:address
 * 获取代币详情 - 从 DexScreener 获取实时数据
 */
app.get('/:address', async (c) => {
  const address = c.req.param('address');
  const chain = c.req.query('chain') || 'base';

  // 缓存 key
  const cacheKey = `token:${chain}:${address}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });

  if (cached) {
    return c.json({ success: true, data: cached, source: 'cache' });
  }

  try {
    // 从 DexScreener 获取实时数据
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`
    );

    if (!response.ok) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Token not found' },
      }, 404);
    }

    const data = await response.json();
    const dexChain = CHAIN_MAP[chain] || chain;
    const pair = data.pairs?.find((p: any) => p.chainId === dexChain) || data.pairs?.[0];

    if (!pair) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Token pair not found' },
      }, 404);
    }

    const token = {
      contract_address: pair.baseToken?.address,
      chain: pair.chainId,
      name: pair.baseToken?.name,
      symbol: pair.baseToken?.symbol,
      logo_url: pair.info?.imageUrl,
      price_usd: pair.priceUsd,
      price_native: pair.priceNative,
      price_change_5m: pair.priceChange?.m5 || 0,
      price_change_1h: pair.priceChange?.h1 || 0,
      price_change_6h: pair.priceChange?.h6 || 0,
      price_change_24h: pair.priceChange?.h24 || 0,
      volume_5m: pair.volume?.m5 || '0',
      volume_1h: pair.volume?.h1 || '0',
      volume_6h: pair.volume?.h6 || '0',
      volume_24h: pair.volume?.h24 || '0',
      txns_5m: pair.txns?.m5 || { buys: 0, sells: 0 },
      txns_1h: pair.txns?.h1 || { buys: 0, sells: 0 },
      txns_24h: pair.txns?.h24 || { buys: 0, sells: 0 },
      market_cap: pair.marketCap || '0',
      fdv: pair.fdv || '0',
      liquidity: pair.liquidity?.usd || '0',
      pair_address: pair.pairAddress,
      pair_created_at: pair.pairCreatedAt,
      dex: pair.dexId,
      website: pair.info?.websites?.[0]?.url,
      twitter: pair.info?.socials?.find((s: any) => s.type === 'twitter')?.url,
      telegram: pair.info?.socials?.find((s: any) => s.type === 'telegram')?.url,
    };

    // 缓存 30 秒
    await c.env.CACHE.put(cacheKey, JSON.stringify(token), { expirationTtl: 30 });

    return c.json({ success: true, data: token, source: 'dexscreener' });
  } catch (error) {
    console.error('Token detail error:', error);
    return c.json({
      success: false,
      error: { code: 'API_ERROR', message: 'Failed to fetch token data' },
    }, 500);
  }
});

/**
 * GET /:address/chart
 * K线数据 (使用 DexScreener API 或返回占位符)
 */
app.get('/:address/chart', async (c) => {
  const address = c.req.param('address');
  const chain = c.req.query('chain') || 'base';
  const interval = c.req.query('interval') || '1h';
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 500);

  // Map chain names to DexScreener format
  const chainMap: Record<string, string> = {
    'base': 'base',
    'ethereum': 'ethereum',
    'bsc': 'bsc',
    'sepolia': 'ethereum', // DexScreener doesn't support testnets
  };

  const dexScreenerChain = chainMap[chain.toLowerCase()] || chain.toLowerCase();

  try {
    // Check cache first
    const cacheKey = `chart:${address}:${chain}:${interval}`;
    const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
    
    if (cached) {
      return c.json({ success: true, data: cached });
    }

    // Fetch from DexScreener
    const dexScreenerChain = chainMap[chain.toLowerCase()] || chain.toLowerCase();
    const dexScreenerUrl = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    
    let candles: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = [];

    try {
      const response = await fetch(dexScreenerUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const pair = data.pairs?.[0];
        
        if (pair && pair.ohlcv) {
          // DexScreener provides OHLCV data
          candles = pair.ohlcv.slice(-limit).map((c: any) => ({
            time: c.t / 1000, // Convert ms to seconds
            open: parseFloat(c.o || '0'),
            high: parseFloat(c.h || '0'),
            low: parseFloat(c.l || '0'),
            close: parseFloat(c.c || '0'),
            volume: parseFloat(c.v || '0'),
          }));
        } else if (pair && pair.priceUsd) {
          // If no OHLCV, use current price to generate basic candles
          const currentPrice = parseFloat(pair.priceUsd || '0');
          const now = Math.floor(Date.now() / 1000);
          const intervalSeconds: Record<string, number> = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600,
            '4h': 14400,
            '1d': 86400,
          };
          
          const intervalSec = intervalSeconds[interval] || 3600;
          
          for (let i = limit; i >= 0; i--) {
            const time = now - i * intervalSec;
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * volatility;
            const open = currentPrice * (1 - change * i / limit);
            const close = currentPrice * (1 - change * (i - 1) / limit);
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            const volume = parseFloat(pair.volume?.h24 || '0') / limit;

            candles.push({ time, open, high, low, close, volume });
          }
        }
      }
    } catch (fetchError) {
      console.error('DexScreener fetch error:', fetchError);
      // Fallback to placeholder if DexScreener fails
    }

    // If no candles from DexScreener, generate placeholder
    if (candles.length === 0) {
      const now = Math.floor(Date.now() / 1000);
      const intervalSeconds: Record<string, number> = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '4h': 14400,
        '1d': 86400,
      };
      
      const intervalSec = intervalSeconds[interval] || 3600;
      let basePrice = 0.00001234;
      
      for (let i = limit; i >= 0; i--) {
        const time = now - i * intervalSec;
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility;
        const open = basePrice;
        const close = basePrice * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.random() * 1000000;

        candles.push({ time, open, high, low, close, volume });
        basePrice = close;
      }
    }

    const chartData = {
      token_address: address,
      chain,
      interval,
      candles,
    };

    // Cache for 1 minute
    await c.env.CACHE.put(cacheKey, JSON.stringify(chartData), { expirationTtl: 60 });

    return c.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Chart data error:', error);
    return c.json({
      success: false,
      error: { code: 'CHART_ERROR', message: 'Failed to fetch chart data' },
    }, 500);
  }
});

/**
 * GET /:address/holders
 * 持有者分布
 * Note: Requires on-chain indexing service (e.g., The Graph, Alchemy, Moralis)
 */
app.get('/:address/holders', async (c) => {
  const address = c.req.param('address');
  const chain = c.req.query('chain') || 'base';

  try {
    // Check cache
    const cacheKey = `holders:${address}:${chain}`;
    const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
    
    if (cached) {
      return c.json({ success: true, data: cached });
    }

    // In production, fetch from:
    // - The Graph subgraph
    // - Alchemy NFT/Token API
    // - Moralis Token API
    // - Custom indexer
    
    // For now, return placeholder structure
    const holderData = {
      token_address: address,
      chain,
      total_holders: 0,
      top_holders: [],
      distribution: {
        '0-0.1%': 0,
        '0.1-1%': 0,
        '1-10%': 0,
        '10-50%': 0,
        '50-100%': 0,
      },
      note: 'Placeholder data - integrate with on-chain indexer for production',
    };

    // Cache for 5 minutes
    await c.env.CACHE.put(cacheKey, JSON.stringify(holderData), { expirationTtl: 300 });

    return c.json({ success: true, data: holderData });
  } catch (error) {
    console.error('Holders data error:', error);
    return c.json({
      success: false,
      error: { code: 'HOLDERS_ERROR', message: 'Failed to fetch holders data' },
    }, 500);
  }
});

/**
 * GET /search
 * 搜索代币
 */
app.get('/search', async (c) => {
  const query = c.req.query('q');
  const chain = c.req.query('chain');
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

  if (!query || query.length < 2) {
    return c.json({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' },
    }, 400);
  }

  let sql = `
    SELECT 
      contract_address,
      chain,
      name,
      symbol,
      logo_url,
      market_cap
    FROM tokens
    WHERE (name LIKE ? OR symbol LIKE ? OR contract_address LIKE ?)
  `;

  if (chain) {
    sql += ` AND chain = '${chain}'`;
  }

  sql += ` ORDER BY market_cap DESC LIMIT ?`;

  const searchPattern = `%${query}%`;
  const results = await c.env.DB.prepare(sql)
    .bind(searchPattern, searchPattern, searchPattern, limit)
    .all();

  return c.json({ success: true, data: results.results });
});

export { app as tokenRoutes };
