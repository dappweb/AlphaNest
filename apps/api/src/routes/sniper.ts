/**
 * Sniper Bot API 路由
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * POST /start
 * 启动狙击 Bot
 */
app.post('/start', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const body = await c.req.json();
  const { targetToken, buyAmount, slippage, autoSell, takeProfit, stopLoss } = body;

  if (!targetToken || !buyAmount) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  try {
    // 检查用户是否有足够的 PopCowDefi
    // TODO: 检查 Solana 链上 PopCowDefi 余额

    // 创建或更新狙击 Bot 记录
    const sniperId = nanoid();
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO sniper_bots (
        id, user_id, target_token, buy_amount, slippage,
        auto_sell, take_profit, stop_loss, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sniperId,
      user.id,
      targetToken,
      buyAmount,
      slippage || 5,
      autoSell ? 1 : 0,
      takeProfit || 50,
      stopLoss || 20,
      'active',
      Date.now(),
      Date.now()
    ).run();

    // 发送到任务队列，启动监控
    await c.env.TASK_QUEUE.send({
      type: 'START_SNIPER',
      payload: {
        sniperId,
        targetToken,
        buyAmount,
        slippage,
        autoSell,
        takeProfit,
        stopLoss,
      },
    });

    return c.json({
      success: true,
      data: {
        id: sniperId,
        status: 'active',
        targetToken,
        buyAmount,
      },
    });
  } catch (error) {
    console.error('Error starting sniper:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to start sniper' },
    }, 500);
  }
});

/**
 * POST /stop
 * 停止狙击 Bot
 */
app.post('/stop', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const body = await c.req.json();
  const { sniperId } = body;

  if (!sniperId) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing sniper ID' },
    }, 400);
  }

  try {
    // 更新状态
    await c.env.DB.prepare(`
      UPDATE sniper_bots 
      SET status = 'stopped', updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(Date.now(), sniperId, user.id).run();

    // 发送到任务队列，停止监控
    await c.env.TASK_QUEUE.send({
      type: 'STOP_SNIPER',
      payload: { sniperId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error stopping sniper:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to stop sniper' },
    }, 500);
  }
});

/**
 * GET /status/:id
 * 获取狙击 Bot 状态
 */
app.get('/status/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const sniperId = c.req.param('id');

  try {
    const sniper = await c.env.DB.prepare(`
      SELECT * FROM sniper_bots
      WHERE id = ? AND user_id = ?
    `).bind(sniperId, user.id).first();

    if (!sniper) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sniper not found' },
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: sniper.id,
        status: sniper.status,
        targetToken: sniper.target_token,
        buyAmount: sniper.buy_amount,
        slippage: sniper.slippage,
        autoSell: Boolean(sniper.auto_sell),
        takeProfit: sniper.take_profit,
        stopLoss: sniper.stop_loss,
        createdAt: sniper.created_at,
        updatedAt: sniper.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching sniper status:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch sniper status' },
    }, 500);
  }
});

/**
 * GET /list
 * 获取用户的狙击 Bot 列表
 */
app.get('/list', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    const snipers = await c.env.DB.prepare(`
      SELECT * FROM sniper_bots
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      data: (snipers.results || []).map((s: any) => ({
        id: s.id,
        status: s.status,
        targetToken: s.target_token,
        buyAmount: s.buy_amount,
        slippage: s.slippage,
        autoSell: Boolean(s.auto_sell),
        takeProfit: s.take_profit,
        stopLoss: s.stop_loss,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching snipers:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch snipers' },
    }, 500);
  }
});

export { app as sniperRoutes };
