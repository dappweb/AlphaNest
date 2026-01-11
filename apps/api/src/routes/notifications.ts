/**
 * Notifications 通知系统路由
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * GET /
 * 获取用户通知列表
 */
app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const unreadOnly = c.req.query('unread') === 'true';

  try {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;

    if (unreadOnly) {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const notifications = await c.env.DB.prepare(query)
      .bind(user.id, limit, offset).all();

    return c.json({
      success: true,
      data: (notifications.results || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        message: n.message,
        timestamp: new Date(n.created_at).toLocaleString(),
        read: Boolean(n.read),
        actionUrl: n.action_url,
        actionLabel: n.action_label,
      })),
      meta: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch notifications' },
    }, 500);
  }
});

/**
 * PUT /:id/read
 * 标记通知为已读
 */
app.put('/:id/read', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const notificationId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      UPDATE notifications 
      SET read = true, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(Date.now(), notificationId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to update notification' },
    }, 500);
  }
});

/**
 * PUT /read-all
 * 标记所有通知为已读
 */
app.put('/read-all', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE notifications 
      SET read = true, updated_at = ?
      WHERE user_id = ? AND read = false
    `).bind(Date.now(), user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to update notifications' },
    }, 500);
  }
});

/**
 * DELETE /:id
 * 删除通知
 */
app.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const notificationId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to delete notification' },
    }, 500);
  }
});

/**
 * DELETE /
 * 清空所有通知
 */
app.delete('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    await c.env.DB.prepare(`
      DELETE FROM notifications 
      WHERE user_id = ?
    `).bind(user.id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to clear notifications' },
    }, 500);
  }
});

export { app as notificationRoutes };
