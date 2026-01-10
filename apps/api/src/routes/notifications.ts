/**
 * 通知 API 路由
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  TELEGRAM_BOT_TOKEN?: string;
}

const notifications = new Hono<{ Bindings: Env }>();

// 获取用户通知列表
notifications.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { userId } = JSON.parse(session);

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, type, title, message, read, data, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userId).all();

    return c.json({
      success: true,
      data: result.results?.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read === 1,
        data: n.data ? JSON.parse(n.data) : null,
        createdAt: n.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return c.json({ success: false, error: 'Failed to fetch notifications' }, 500);
  }
});

// 标记通知为已读
notifications.post('/:id/read', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { userId } = JSON.parse(session);
  const notificationId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return c.json({ success: false, error: 'Failed to update notification' }, 500);
  }
});

// 标记所有通知为已读
notifications.post('/read-all', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { userId } = JSON.parse(session);

  try {
    await c.env.DB.prepare(`
      UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0
    `).bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return c.json({ success: false, error: 'Failed to update notifications' }, 500);
  }
});

// 获取未读通知数量
notifications.get('/unread-count', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { userId } = JSON.parse(session);

  try {
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `).bind(userId).first();

    return c.json({
      success: true,
      data: { count: (result as any)?.count || 0 },
    });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return c.json({ success: false, error: 'Failed to get count' }, 500);
  }
});

// 更新通知偏好设置
const preferencesSchema = z.object({
  whaleAlerts: z.boolean().optional(),
  devLaunches: z.boolean().optional(),
  priceAlerts: z.boolean().optional(),
  insuranceUpdates: z.boolean().optional(),
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().optional(),
  emailEnabled: z.boolean().optional(),
  email: z.string().email().optional(),
});

notifications.put('/preferences', zValidator('json', preferencesSchema), async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { userId } = JSON.parse(session);
  const preferences = c.req.valid('json');

  try {
    // Store preferences in KV for quick access
    await c.env.SESSIONS.put(
      `prefs:${userId}`,
      JSON.stringify(preferences),
      { expirationTtl: 60 * 60 * 24 * 365 } // 1 year
    );

    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return c.json({ success: false, error: 'Failed to update preferences' }, 500);
  }
});

// 获取通知偏好设置
notifications.get('/preferences', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { userId } = JSON.parse(session);

  try {
    const prefs = await c.env.SESSIONS.get(`prefs:${userId}`);
    
    const defaultPrefs = {
      whaleAlerts: true,
      devLaunches: true,
      priceAlerts: true,
      insuranceUpdates: true,
      telegramEnabled: false,
      telegramChatId: null,
      emailEnabled: false,
      email: null,
    };

    return c.json({
      success: true,
      data: prefs ? { ...defaultPrefs, ...JSON.parse(prefs) } : defaultPrefs,
    });
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return c.json({ success: false, error: 'Failed to get preferences' }, 500);
  }
});

// 内部方法: 创建通知
export async function createNotification(
  db: D1Database,
  data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  const id = nanoid();
  const now = Math.floor(Date.now() / 1000);

  await db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, data, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).bind(
    id,
    data.userId,
    data.type,
    data.title,
    data.message,
    data.data ? JSON.stringify(data.data) : null,
    now
  ).run();
}

export default notifications;
