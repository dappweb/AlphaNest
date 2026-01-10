/**
 * Dev (代币发行者) 模块路由
 */

import { Hono } from 'hono';

const app = new Hono();

// ============================================
// 路由定义
// ============================================

/**
 * GET /:address/score
 * 查询 Dev 信誉评分
 */
app.get('/:address/score', async (c) => {
  const address = c.req.param('address');

  // 先检查缓存
  const cacheKey = `dev_score:${address}`;
  const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });

  if (cached) {
    return c.json({ success: true, data: cached });
  }

  // 查询数据库
  const dev = await c.env.DB.prepare(`
    SELECT 
      wallet_address as address,
      score,
      tier,
      verified,
      total_launches,
      successful_launches,
      rug_count,
      total_volume,
      avg_ath_multiplier
    FROM devs
    WHERE wallet_address = ?
  `).bind(address).first();

  if (!dev) {
    // Dev 不存在，返回默认数据
    const defaultDev = {
      address,
      score: 50,
      rank: 0,
      tier: 'unranked',
      verified: false,
      stats: {
        total_launches: 0,
        successful_launches: 0,
        win_rate: 0,
        avg_ath_multiplier: 0,
        rug_count: 0,
        total_volume: '0',
      },
      history: [],
    };

    return c.json({ success: true, data: defaultDev });
  }

  // 计算胜率
  const winRate = dev.total_launches > 0
    ? (dev.successful_launches as number) / (dev.total_launches as number)
    : 0;

  // 获取排名
  const rankResult = await c.env.DB.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM devs
    WHERE score > ?
  `).bind(dev.score).first();

  // 获取发币历史
  const history = await c.env.DB.prepare(`
    SELECT 
      t.contract_address,
      t.chain,
      t.name,
      t.symbol,
      t.status,
      t.market_cap,
      t.ath_market_cap,
      t.created_at,
      t.rug_detected_at
    FROM tokens t
    WHERE t.creator_dev_id = (SELECT id FROM devs WHERE wallet_address = ?)
    ORDER BY t.created_at DESC
    LIMIT 20
  `).bind(address).all();

  const response = {
    address: dev.wallet_address,
    score: dev.score,
    rank: (rankResult as any)?.rank || 0,
    tier: dev.tier,
    verified: Boolean(dev.verified),
    stats: {
      total_launches: dev.total_launches,
      successful_launches: dev.successful_launches,
      win_rate: winRate,
      avg_ath_multiplier: dev.avg_ath_multiplier,
      rug_count: dev.rug_count,
      total_volume: dev.total_volume,
    },
    history: history.results || [],
  };

  // 缓存结果 (5分钟)
  await c.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });

  return c.json({ success: true, data: response });
});

/**
 * GET /leaderboard
 * Dev 战绩榜排行
 */
app.get('/leaderboard', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const sortBy = c.req.query('sort_by') || 'score';
  const chain = c.req.query('chain');
  const offset = (page - 1) * limit;

  // 验证排序字段
  const validSortFields = ['score', 'total_launches', 'total_volume'];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : 'score';

  // 构建查询
  let query = `
    SELECT 
      d.wallet_address as address,
      d.alias,
      d.score,
      d.tier,
      d.verified,
      d.total_launches,
      d.successful_launches,
      d.rug_count,
      d.total_volume,
      d.avg_ath_multiplier,
      CASE WHEN d.total_launches > 0 
        THEN CAST(d.successful_launches AS REAL) / d.total_launches 
        ELSE 0 
      END as win_rate
    FROM devs d
    WHERE d.total_launches > 0
  `;

  // 按链过滤 (如果指定)
  if (chain) {
    query += `
      AND EXISTS (
        SELECT 1 FROM tokens t 
        WHERE t.creator_dev_id = d.id AND t.chain = '${chain}'
      )
    `;
  }

  query += ` ORDER BY ${orderBy} DESC LIMIT ? OFFSET ?`;

  const devs = await c.env.DB.prepare(query).bind(limit, offset).all();

  // 获取总数
  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM devs WHERE total_launches > 0'
  ).first();

  return c.json({
    success: true,
    data: devs.results,
    meta: {
      page,
      limit,
      total: (countResult as any)?.count || 0,
    },
  });
});

/**
 * GET /:address/tokens
 * 获取 Dev 发行的代币列表
 */
app.get('/:address/tokens', async (c) => {
  const address = c.req.param('address');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const tokens = await c.env.DB.prepare(`
    SELECT 
      t.contract_address,
      t.chain,
      t.name,
      t.symbol,
      t.logo_url,
      t.status,
      t.market_cap,
      t.holder_count,
      t.liquidity,
      t.ath_market_cap,
      t.created_at
    FROM tokens t
    INNER JOIN devs d ON t.creator_dev_id = d.id
    WHERE d.wallet_address = ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(address, limit, offset).all();

  return c.json({
    success: true,
    data: tokens.results,
  });
});

/**
 * POST /:address/subscribe
 * 订阅 Dev (跟单)
 */
app.post('/:address/subscribe', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const devAddress = c.req.param('address');

  // 获取 Dev ID
  const dev = await c.env.DB.prepare(
    'SELECT id FROM devs WHERE wallet_address = ?'
  ).bind(devAddress).first();

  if (!dev) {
    return c.json({
      success: false,
      error: { code: 'DEV_NOT_FOUND', message: 'Dev not found' },
    }, 404);
  }

  // 创建订阅
  const { nanoid } = await import('nanoid');

  await c.env.DB.prepare(`
    INSERT INTO dev_subscriptions (id, user_id, dev_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, dev_id) DO NOTHING
  `).bind(nanoid(), user.id, dev.id).run();

  return c.json({
    success: true,
    data: { subscribed: true },
  });
});

/**
 * DELETE /:address/subscribe
 * 取消订阅 Dev
 */
app.delete('/:address/subscribe', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const devAddress = c.req.param('address');

  await c.env.DB.prepare(`
    DELETE FROM dev_subscriptions
    WHERE user_id = ? AND dev_id = (
      SELECT id FROM devs WHERE wallet_address = ?
    )
  `).bind(user.id, devAddress).run();

  return c.json({
    success: true,
    data: { subscribed: false },
  });
});

export { app as devRoutes };
