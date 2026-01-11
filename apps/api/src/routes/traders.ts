/**
 * 交易员和跟单交易路由
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * GET /traders
 * 获取交易员列表
 */
app.get('/traders', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const sortBy = c.req.query('sortBy') || 'pnl';
  const filter = c.req.query('filter'); // 'verified', 'following', 'top10'

  let query = `
    SELECT 
      t.id,
      t.address,
      t.alias,
      t.verified,
      t.score,
      t.tier,
      t.pnl_total as pnl,
      t.pnl_percent,
      t.win_rate,
      t.trades_count as trades,
      t.followers_count as followers,
      t.aum,
      t.created_at,
      t.updated_at
    FROM traders t
    WHERE 1=1
  `;

  if (filter === 'verified') {
    query += ` AND t.verified = true`;
  }

  // Sorting
  const orderBy = sortBy === 'pnl' ? 't.pnl_total DESC' :
                  sortBy === 'winRate' ? 't.win_rate DESC' :
                  sortBy === 'followers' ? 't.followers_count DESC' :
                  't.pnl_total DESC';

  query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

  try {
    const traders = await c.env.DB.prepare(query).bind(limit, offset).all();
    const total = await c.env.DB.prepare('SELECT COUNT(*) as count FROM traders').first();

    return c.json({
      success: true,
      data: traders.results,
      meta: {
        page,
        limit,
        total: (total as any)?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching traders:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch traders' },
    }, 500);
  }
});

/**
 * GET /traders/:id
 * 获取交易员详情
 */
app.get('/traders/:id', async (c) => {
  const traderId = c.req.param('id');

  try {
    const trader = await c.env.DB.prepare(`
      SELECT * FROM traders WHERE id = ? OR address = ?
    `).bind(traderId, traderId).first();

    if (!trader) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Trader not found' },
      }, 404);
    }

    // Get recent trades
    const trades = await c.env.DB.prepare(`
      SELECT * FROM copy_trades 
      WHERE trader_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).bind(traderId).all();

    return c.json({
      success: true,
      data: {
        ...trader,
        recentTrades: trades.results,
      },
    });
  } catch (error) {
    console.error('Error fetching trader:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch trader' },
    }, 500);
  }
});

/**
 * POST /copy-trades
 * 创建跟单订单
 */
app.post('/copy-trades', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const body = await c.req.json();
  const { trader_id, investment_amount, copy_ratio, stop_loss, take_profit } = body;

  if (!trader_id || !investment_amount) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  try {
    // Verify trader exists
    const trader = await c.env.DB.prepare('SELECT * FROM traders WHERE id = ?').bind(trader_id).first();
    if (!trader) {
      return c.json({
        success: false,
        error: { code: 'TRADER_NOT_FOUND', message: 'Trader not found' },
      }, 404);
    }

    // Create copy trade order
    const orderId = nanoid();
    await c.env.DB.prepare(`
      INSERT INTO copy_trades (
        id, user_id, trader_id, investment_amount, copy_ratio,
        stop_loss, take_profit, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      user.id,
      trader_id,
      investment_amount,
      copy_ratio || 1.0,
      stop_loss || null,
      take_profit || null,
      'active',
      Date.now(),
      Date.now()
    ).run();

    return c.json({
      success: true,
      data: {
        id: orderId,
        trader_id,
        investment_amount,
        copy_ratio: copy_ratio || 1.0,
        status: 'active',
        created_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error creating copy trade:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to create copy trade' },
    }, 500);
  }
});

/**
 * GET /copy-trades
 * 获取用户的跟单列表
 */
app.get('/copy-trades', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      ct.*,
      t.address as trader_address,
      t.alias as trader_alias,
      t.verified as trader_verified,
      t.score as trader_score
    FROM copy_trades ct
    INNER JOIN traders t ON ct.trader_id = t.id
    WHERE ct.user_id = ?
  `;

  if (status) {
    query += ` AND ct.status = '${status}'`;
  }

  query += ` ORDER BY ct.created_at DESC LIMIT ? OFFSET ?`;

  try {
    const trades = await c.env.DB.prepare(query).bind(user.id, limit, offset).all();

    return c.json({
      success: true,
      data: trades.results,
      meta: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching copy trades:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch copy trades' },
    }, 500);
  }
});

/**
 * PUT /copy-trades/:id
 * 更新跟单订单（暂停/恢复/取消）
 */
app.put('/copy-trades/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const orderId = c.req.param('id');
  const { status } = await c.req.json();

  if (!['active', 'paused', 'cancelled'].includes(status)) {
    return c.json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Invalid status' },
    }, 400);
  }

  try {
    // Verify ownership
    const order = await c.env.DB.prepare('SELECT * FROM copy_trades WHERE id = ? AND user_id = ?')
      .bind(orderId, user.id).first();

    if (!order) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Copy trade order not found' },
      }, 404);
    }

    // Update status
    await c.env.DB.prepare(`
      UPDATE copy_trades 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, Date.now(), orderId).run();

    return c.json({
      success: true,
      data: {
        id: orderId,
        status,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error updating copy trade:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to update copy trade' },
    }, 500);
  }
});

/**
 * POST /copy-trades/:id/execute
 * 执行跟单交易（当交易员执行交易时调用）
 * Note: This would typically be called by a background service monitoring trader transactions
 */
app.post('/copy-trades/:id/execute', async (c) => {
  const orderId = c.req.param('id');
  const body = await c.req.json();
  const { trader_tx_hash, token_in, token_out, amount_in, amount_out } = body;

  if (!trader_tx_hash || !token_in || !token_out || !amount_in) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  try {
    // Get copy trade order
    const order = await c.env.DB.prepare('SELECT * FROM copy_trades WHERE id = ? AND status = ?')
      .bind(orderId, 'active').first();

    if (!order) {
      return c.json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Copy trade order not found or not active' },
      }, 404);
    }

    // Calculate copy amount based on copy_ratio
    const copyAmount = BigInt(amount_in) * BigInt(Math.floor((order as any).copy_ratio * 100)) / BigInt(100);
    
    // Check max position size
    const maxPosition = BigInt((order as any).max_position_size || '999999999999999999');
    const finalAmount = copyAmount > maxPosition ? maxPosition : copyAmount;

    // Create execution record
    const executionId = nanoid();
    await c.env.DB.prepare(`
      INSERT INTO copy_trade_executions (
        id, copy_trade_id, trader_tx_hash, token_in, token_out,
        amount_in, amount_out, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      executionId,
      orderId,
      trader_tx_hash,
      token_in,
      token_out,
      finalAmount.toString(),
      '0', // Will be updated after execution
      'pending',
      Date.now()
    ).run();

    // TODO: In production, this would trigger actual trade execution
    // For now, we just log it
    return c.json({
      success: true,
      data: {
        execution_id: executionId,
        copy_trade_id: orderId,
        amount: finalAmount.toString(),
        status: 'pending',
        message: 'Copy trade execution queued. In production, this would trigger actual trade execution.',
      },
    });
  } catch (error) {
    console.error('Error executing copy trade:', error);
    return c.json({
      success: false,
      error: { code: 'EXECUTION_ERROR', message: 'Failed to execute copy trade' },
    }, 500);
  }
});

/**
 * POST /traders/:id/follow
 * 关注交易员
 */
app.post('/traders/:id/follow', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const traderId = c.req.param('id');

  try {
    // Verify trader exists
    const trader = await c.env.DB.prepare('SELECT * FROM traders WHERE id = ? OR address = ?')
      .bind(traderId, traderId).first();
    
    if (!trader) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Trader not found' },
      }, 404);
    }

    // Check if already following (would need a followers table)
    // For now, just increment followers_count
    await c.env.DB.prepare(`
      UPDATE traders 
      SET followers_count = followers_count + 1, updated_at = ?
      WHERE id = ?
    `).bind(Date.now(), (trader as any).id).run();

    return c.json({
      success: true,
      data: { message: 'Successfully followed trader' },
    });
  } catch (error) {
    console.error('Error following trader:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to follow trader' },
    }, 500);
  }
});

/**
 * POST /traders/:id/unfollow
 * 取消关注交易员
 */
app.post('/traders/:id/unfollow', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const traderId = c.req.param('id');

  try {
    // Verify trader exists
    const trader = await c.env.DB.prepare('SELECT * FROM traders WHERE id = ? OR address = ?')
      .bind(traderId, traderId).first();
    
    if (!trader) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Trader not found' },
      }, 404);
    }

    // Decrement followers_count
    await c.env.DB.prepare(`
      UPDATE traders 
      SET followers_count = GREATEST(followers_count - 1, 0), updated_at = ?
      WHERE id = ?
    `).bind(Date.now(), (trader as any).id).run();

    return c.json({
      success: true,
      data: { message: 'Successfully unfollowed trader' },
    });
  } catch (error) {
    console.error('Error unfollowing trader:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to unfollow trader' },
    }, 500);
  }
});

export { app as traderRoutes };
