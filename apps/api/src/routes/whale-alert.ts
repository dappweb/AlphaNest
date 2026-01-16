/**
 * Whale Alert API 路由
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * POST /subscribe
 * 订阅鲸鱼预警
 */
app.post('/subscribe', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const body = await c.req.json();
  const { minAmount, trackedTokens, channels } = body;

  try {
    // 创建或更新订阅
    const subscriptionId = nanoid();
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO whale_alert_subscriptions (
        id, user_id, min_amount, tracked_tokens, channels, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      subscriptionId,
      user.id,
      minAmount || 10000,
      JSON.stringify(trackedTokens || []),
      JSON.stringify(channels || ['telegram', 'web']),
      1,
      Date.now(),
      Date.now()
    ).run();

    // 发送到任务队列，启动监控
    await c.env.TASK_QUEUE.send({
      type: 'START_WHALE_MONITOR',
      payload: {
        subscriptionId,
        userId: user.id,
        minAmount: minAmount || 10000,
        trackedTokens: trackedTokens || [],
      },
    });

    return c.json({
      success: true,
      data: {
        id: subscriptionId,
        enabled: true,
        minAmount: minAmount || 10000,
        trackedTokens: trackedTokens || [],
      },
    });
  } catch (error) {
    console.error('Error subscribing to whale alerts:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to subscribe' },
    }, 500);
  }
});

/**
 * POST /unsubscribe
 * 取消订阅鲸鱼预警
 */
app.post('/unsubscribe', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    // 更新订阅状态
    await c.env.DB.prepare(`
      UPDATE whale_alert_subscriptions 
      SET enabled = 0, updated_at = ?
      WHERE user_id = ?
    `).bind(Date.now(), user.id).run();

    // 发送到任务队列，停止监控
    await c.env.TASK_QUEUE.send({
      type: 'STOP_WHALE_MONITOR',
      payload: { userId: user.id },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to unsubscribe' },
    }, 500);
  }
});

/**
 * GET /status
 * 获取订阅状态
 */
app.get('/status', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    const subscription = await c.env.DB.prepare(`
      SELECT * FROM whale_alert_subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user.id).first();

    if (!subscription) {
      return c.json({
        success: true,
        data: {
          enabled: false,
          minAmount: 10000,
          trackedTokens: [],
        },
      });
    }

    return c.json({
      success: true,
      data: {
        enabled: Boolean(subscription.enabled),
        minAmount: subscription.min_amount,
        trackedTokens: JSON.parse(subscription.tracked_tokens || '[]'),
        channels: JSON.parse(subscription.channels || '[]'),
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch status' },
    }, 500);
  }
});

/**
 * GET /alerts
 * 获取最近的鲸鱼警报
 */
app.get('/alerts', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

  try {
    const alerts = await c.env.DB.prepare(`
      SELECT * FROM whale_alerts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(user.id, limit).all();

    return c.json({
      success: true,
      data: (alerts.results || []).map((a: any) => ({
        id: a.id,
        wallet: a.wallet,
        token: a.token,
        tokenSymbol: a.token_symbol,
        type: a.type,
        amount: a.amount,
        amountUsd: a.amount_usd,
        timestamp: a.created_at,
        txHash: a.tx_hash,
      })),
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch alerts' },
    }, 500);
  }
});

export { app as whaleAlertRoutes };
