/**
 * Analytics 数据分析路由
 */

import { Hono } from 'hono';

const app = new Hono();

/**
 * GET /volume
 * 获取交易量统计
 */
app.get('/volume', async (c) => {
  const timeRange = c.req.query('range') || '7d'; // 7d, 30d, 90d
  const chainId = parseInt(c.req.query('chainId') || '0'); // 0 = all chains

  try {
    // Calculate days from range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    let query = `
      SELECT 
        DATE(created_at / 1000, 'unixepoch') as date,
        SUM(CAST(amount AS REAL)) as volume,
        COUNT(*) as trades
      FROM trade_logs
      WHERE created_at >= ?
    `;

    if (chainId > 0) {
      query += ` AND chain_id = ${chainId}`;
    }

    query += ` GROUP BY date ORDER BY date ASC`;

    const result = await c.env.DB.prepare(query).bind(startTime).all();

    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    console.error('Error fetching volume:', error);
    return c.json({
      success: false,
      error: { code: 'VOLUME_ERROR', message: 'Failed to fetch volume data' },
    }, 500);
  }
});

/**
 * GET /tokens
 * 获取代币排行
 */
app.get('/tokens', async (c) => {
  const sortBy = c.req.query('sortBy') || 'volume'; // volume, market_cap, holders
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  try {
    const orderBy = sortBy === 'volume' ? 'volume_24h DESC' :
                    sortBy === 'market_cap' ? 'market_cap DESC' :
                    'holder_count DESC';

    const tokens = await c.env.DB.prepare(`
      SELECT 
        contract_address,
        chain,
        name,
        symbol,
        market_cap,
        volume_24h,
        holder_count,
        price_change_24h
      FROM tokens
      WHERE status = 'active'
      ORDER BY ${orderBy}
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      success: true,
      data: tokens.results || [],
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return c.json({
      success: false,
      error: { code: 'TOKENS_ERROR', message: 'Failed to fetch token data' },
    }, 500);
  }
});

/**
 * GET /chains
 * 获取链分布统计
 */
app.get('/chains', async (c) => {
  try {
    const distribution = await c.env.DB.prepare(`
      SELECT 
        chain,
        COUNT(*) as token_count,
        SUM(CAST(market_cap AS REAL)) as total_market_cap,
        SUM(CAST(volume_24h AS REAL)) as total_volume
      FROM tokens
      WHERE status = 'active'
      GROUP BY chain
      ORDER BY total_volume DESC
    `).all();

    return c.json({
      success: true,
      data: distribution.results || [],
    });
  } catch (error) {
    console.error('Error fetching chain distribution:', error);
    return c.json({
      success: false,
      error: { code: 'CHAIN_ERROR', message: 'Failed to fetch chain data' },
    }, 500);
  }
});

/**
 * GET /platform
 * 获取平台统计数据
 */
app.get('/platform', async (c) => {
  try {
    // Get total users
    const usersResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    const totalUsers = (usersResult as any)?.count || 0;

    // Get total volume
    const volumeResult = await c.env.DB.prepare(`
      SELECT SUM(CAST(amount AS REAL)) as total FROM trade_logs
    `).first();
    const totalVolume = parseFloat((volumeResult as any)?.total || '0');

    // Get active tokens
    const tokensResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tokens WHERE status = 'active'
    `).first();
    const activeTokens = (tokensResult as any)?.count || 0;

    // Get TVL (Total Value Locked) - sum of all active insurance pools
    // Calculate from totalRugStake + totalSafeStake
    const tvlResult = await c.env.DB.prepare(`
      SELECT 
        SUM(CAST(total_rug_stake AS REAL) + CAST(total_safe_stake AS REAL)) as total 
      FROM insurance_pools 
      WHERE status = 'active'
    `).first();
    let tvl = parseFloat((tvlResult as any)?.total || '0');
    
    // If database doesn't have insurance_pools table or no data, try to query contract
    if (tvl === 0 && c.env.CONTRACT_ALPHAGUARD) {
      // TODO: Query AlphaGuard contract for total TVL
      // This would require RPC call to contract
      // For now, use database value
    }

    // Calculate active traders and copy trades
    const activeTraders = await calculateActiveTraders(c.env.DB);
    const totalCopyTrades = await calculateTotalCopyTrades(c.env.DB);

    return c.json({
      success: true,
      data: {
        totalUsers,
        totalVolume,
        activeTokens,
        tvl,
        activeTraders,
        totalCopyTrades,
      },
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return c.json({
      success: false,
      error: { code: 'PLATFORM_ERROR', message: 'Failed to fetch platform data' },
    }, 500);
  }
});


/**
 * GET /chains
 * 获取各链交易量分布
 */
app.get('/chains', async (c) => {
  try {
    const chains = await c.env.DB.prepare(`
      SELECT 
        chain,
        SUM(CAST(amount AS REAL)) as total_volume,
        COUNT(*) as trade_count
      FROM trade_logs
      WHERE created_at >= ?
      GROUP BY chain
      ORDER BY total_volume DESC
    `).bind(Math.floor(Date.now() / 1000) - 24 * 3600).all();

    return c.json({
      success: true,
      data: (chains.results || []).map((c: any) => ({
        chain: c.chain,
        total_volume: parseFloat(c.total_volume || '0'),
        trade_count: parseInt(c.trade_count || '0'),
      })),
    });
  } catch (error) {
    console.error('Error fetching chain distribution:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch chain distribution' },
    }, 500);
  }
});

/**
 * Helper: Calculate active traders count (last 7 days)
 */
async function calculateActiveTraders(db: D1Database): Promise<number> {
  try {
    const result = await db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM trade_logs
      WHERE created_at >= ?
    `).bind(Math.floor(Date.now() / 1000) - 7 * 24 * 3600).first();
    return parseInt((result as any)?.count || '0');
  } catch (error) {
    console.error('Error calculating active traders:', error);
    return 0;
  }
}

/**
 * Helper: Calculate total copy trades count
 */
async function calculateTotalCopyTrades(db: D1Database): Promise<number> {
  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM copy_trades WHERE status = 'active'
    `).first();
    return parseInt((result as any)?.count || '0');
  } catch (error) {
    console.error('Error calculating total copy trades:', error);
    return 0;
  }
}

export { app as analyticsRoutes };
