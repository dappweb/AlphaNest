/**
 * Trading Bots 交易机器人路由
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * GET /
 * 获取用户的机器人列表
 */
app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    const bots = await c.env.DB.prepare(`
      SELECT * FROM bots
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    const mappedBots = (bots.results || []).map((bot: any) => ({
      id: bot.id,
      name: bot.name,
      type: bot.type,
      status: bot.status,
      pnl: parseFloat(bot.pnl || '0'),
      pnlPercent: parseFloat(bot.pnl_percent || '0'),
      trades: parseInt(bot.trades_count || '0'),
      winRate: parseFloat(bot.win_rate || '0'),
      investment: parseFloat(bot.investment || '0'),
      currentValue: parseFloat(bot.current_value || '0'),
      chain: bot.chain,
      config: bot.config ? JSON.parse(bot.config) : {},
      createdAt: bot.created_at,
      updatedAt: bot.updated_at,
    }));

    return c.json({
      success: true,
      data: mappedBots,
    });
  } catch (error) {
    console.error('Error fetching bots:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch bots' },
    }, 500);
  }
});

/**
 * POST /
 * 创建新的交易机器人
 */
app.post('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const body = await c.req.json();
  const { name, type, investment, chain, config } = body;

  if (!name || !type || !investment || !chain) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  try {
    const botId = nanoid();
    await c.env.DB.prepare(`
      INSERT INTO bots (
        id, user_id, name, type, investment, current_value,
        chain, config, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      botId,
      user.id,
      name,
      type,
      investment,
      investment, // Initial value equals investment
      chain,
      JSON.stringify(config || {}),
      'stopped',
      Date.now(),
      Date.now()
    ).run();

    return c.json({
      success: true,
      data: {
        id: botId,
        name,
        type,
        status: 'stopped',
        investment,
        currentValue: investment,
        chain,
        config: config || {},
      },
    });
  } catch (error) {
    console.error('Error creating bot:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to create bot' },
    }, 500);
  }
});

/**
 * PUT /:id
 * 更新机器人配置或状态
 */
app.put('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const botId = c.req.param('id');
  const body = await c.req.json();
  const { status, config, name } = body;

  try {
    // Verify ownership
    const bot = await c.env.DB.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?')
      .bind(botId, user.id).first();

    if (!bot) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bot not found' },
      }, 404);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(config));
    }

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (updates.length === 0) {
      return c.json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'No fields to update' },
      }, 400);
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(botId);
    values.push(user.id);

    await c.env.DB.prepare(`
      UPDATE bots 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating bot:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to update bot' },
    }, 500);
  }
});

/**
 * DELETE /:id
 * 删除机器人
 */
app.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const botId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      DELETE FROM bots 
      WHERE id = ? AND user_id = ?
    `).bind(botId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to delete bot' },
    }, 500);
  }
});

/**
 * GET /:id/stats
 * 获取机器人统计信息
 */
app.get('/:id/stats', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const botId = c.req.param('id');

  try {
    const bot = await c.env.DB.prepare(`
      SELECT * FROM bots WHERE id = ? AND user_id = ?
    `).bind(botId, user.id).first();

    if (!bot) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bot not found' },
      }, 404);
    }

    // Get bot trades (if we have a trades table)
    // For now, return bot stats
    return c.json({
      success: true,
      data: {
        pnl: parseFloat((bot as any).pnl || '0'),
        pnlPercent: parseFloat((bot as any).pnl_percent || '0'),
        trades: parseInt((bot as any).trades_count || '0'),
        winRate: parseFloat((bot as any).win_rate || '0'),
        investment: parseFloat((bot as any).investment || '0'),
        currentValue: parseFloat((bot as any).current_value || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch bot stats' },
    }, 500);
  }
});

export { app as botRoutes };
