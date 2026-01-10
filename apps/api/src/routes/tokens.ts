/**
 * 代币模块路由
 */

import { Hono } from 'hono';

const app = new Hono();

/**
 * GET /trending
 * 热门代币列表
 */
app.get('/trending', async (c) => {
  const chain = c.req.query('chain');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  // 检查缓存
  const cacheKey = `trending:${chain || 'all'}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });

  if (cached) {
    return c.json({ success: true, data: cached });
  }

  let query = `
    SELECT 
      t.contract_address,
      t.chain,
      t.name,
      t.symbol,
      t.logo_url,
      t.market_cap,
      t.holder_count,
      t.liquidity,
      t.status,
      d.wallet_address as dev_address,
      d.score as dev_score,
      d.verified as dev_verified
    FROM tokens t
    LEFT JOIN devs d ON t.creator_dev_id = d.id
    WHERE t.status = 'active'
  `;

  if (chain) {
    query += ` AND t.chain = '${chain}'`;
  }

  query += ` ORDER BY t.market_cap DESC LIMIT ?`;

  const tokens = await c.env.DB.prepare(query).bind(limit).all();

  // 缓存 1 分钟
  await c.env.CACHE.put(cacheKey, JSON.stringify(tokens.results), { expirationTtl: 60 });

  return c.json({ success: true, data: tokens.results });
});

/**
 * GET /:address
 * 获取代币详情
 */
app.get('/:address', async (c) => {
  const address = c.req.param('address');
  const chain = c.req.query('chain') || 'base';

  const token = await c.env.DB.prepare(`
    SELECT 
      t.*,
      d.wallet_address as dev_address,
      d.alias as dev_alias,
      d.score as dev_score,
      d.tier as dev_tier,
      d.verified as dev_verified,
      d.total_launches as dev_total_launches,
      d.successful_launches as dev_successful_launches
    FROM tokens t
    LEFT JOIN devs d ON t.creator_dev_id = d.id
    WHERE t.contract_address = ? AND t.chain = ?
  `).bind(address, chain).first();

  if (!token) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Token not found' },
    }, 404);
  }

  return c.json({ success: true, data: token });
});

/**
 * GET /:address/chart
 * K线数据
 */
app.get('/:address/chart', async (c) => {
  const address = c.req.param('address');
  const chain = c.req.query('chain') || 'base';
  const interval = c.req.query('interval') || '1h';
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 500);

  // TODO: 从外部数据源获取 K 线数据
  // const chartData = await fetchChartData(address, chain, interval, limit);

  // 返回模拟数据结构
  return c.json({
    success: true,
    data: {
      token_address: address,
      chain,
      interval,
      candles: [], // { time, open, high, low, close, volume }
    },
  });
});

/**
 * GET /:address/holders
 * 持有者分布
 */
app.get('/:address/holders', async (c) => {
  const address = c.req.param('address');
  const chain = c.req.query('chain') || 'base';

  // TODO: 从链上索引获取持有者数据
  return c.json({
    success: true,
    data: {
      token_address: address,
      chain,
      total_holders: 0,
      top_holders: [],
      distribution: {},
    },
  });
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
