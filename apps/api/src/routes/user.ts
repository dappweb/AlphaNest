/**
 * 用户模块路由
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { generateToken } from '../middleware/auth';

const app = new Hono();

// ============================================
// Schema 定义
// ============================================

const connectSchema = z.object({
  wallet_address: z.string().min(20).max(64),
  chain: z.enum(['solana', 'base', 'ethereum', 'bnb']),
  signature: z.string(),
  message: z.string(),
});

const verifyHoldingSchema = z.object({
  chain: z.string(),
  token_address: z.string(),
  proof: z.string().optional(),
});

// ============================================
// 路由定义
// ============================================

/**
 * POST /connect
 * 钱包连接与会话创建
 */
app.post('/connect', zValidator('json', connectSchema), async (c) => {
  const { wallet_address, chain, signature, message } = c.req.valid('json');

  // TODO: 验证签名
  // const isValid = await verifySignature(wallet_address, signature, message, chain);
  // if (!isValid) {
  //   return c.json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } }, 401);
  // }

  // 查找或创建用户
  let user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE wallet_address = ?'
  ).bind(wallet_address).first();

  if (!user) {
    const userId = nanoid();
    await c.env.DB.prepare(
      'INSERT INTO users (id, wallet_address) VALUES (?, ?)'
    ).bind(userId, wallet_address).run();

    user = { id: userId, wallet_address };
  }

  // 记录链连接
  await c.env.DB.prepare(`
    INSERT INTO user_chains (id, user_id, chain, chain_address, verified_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, chain) DO UPDATE SET
      chain_address = excluded.chain_address,
      verified_at = excluded.verified_at
  `).bind(nanoid(), user.id, chain, wallet_address, Date.now()).run();

  // 获取用户连接的所有链
  const chains = await c.env.DB.prepare(
    'SELECT chain FROM user_chains WHERE user_id = ?'
  ).bind(user.id).all();

  const chainList = chains.results?.map((r: any) => r.chain) || [chain];

  // 生成 JWT
  const token = await generateToken(
    user.id as string,
    wallet_address,
    chainList,
    c.env.JWT_SECRET
  );

  // 存储会话到 KV
  const sessionData = {
    user_id: user.id,
    wallet_address,
    chains: chainList,
    created_at: Date.now(),
    last_active: Date.now(),
  };

  await c.env.SESSIONS.put(
    `session:${user.id}`,
    JSON.stringify(sessionData),
    { expirationTtl: 86400 } // 24 小时
  );

  return c.json({
    success: true,
    data: {
      user_id: user.id,
      token,
      expires_at: Date.now() + 86400 * 1000,
    },
  });
});

/**
 * POST /verify-holding
 * 验证多链持仓获取积分
 */
app.post('/verify-holding', zValidator('json', verifyHoldingSchema), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const { chain, token_address, proof } = c.req.valid('json');

  // TODO: 实现存储证明验证
  // const balance = await verifyHoldingWithProof(chain, token_address, user.wallet, proof);

  // 模拟验证结果
  const verified = true;
  const balance = '1000000000000000000'; // 1 token
  const pointsEarned = 100;

  if (verified) {
    // 更新用户积分
    await c.env.DB.prepare(
      'UPDATE users SET total_points = total_points + ? WHERE id = ?'
    ).bind(pointsEarned, user.id).run();

    // 记录积分历史
    await c.env.DB.prepare(`
      INSERT INTO points_history (id, user_id, amount, reason, reference_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(nanoid(), user.id, pointsEarned, 'verify_holding', token_address).run();
  }

  return c.json({
    success: true,
    data: {
      verified,
      balance,
      points_earned: pointsEarned,
    },
  });
});

/**
 * GET /profile
 * 获取用户资料
 */
app.get('/profile', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const profile = await c.env.DB.prepare(`
    SELECT 
      id, wallet_address, total_points, reputation_score, 
      verification_level, created_at
    FROM users WHERE id = ?
  `).bind(user.id).first();

  const chains = await c.env.DB.prepare(
    'SELECT chain, chain_address, verified_at FROM user_chains WHERE user_id = ?'
  ).bind(user.id).all();

  return c.json({
    success: true,
    data: {
      ...profile,
      chains: chains.results,
    },
  });
});

/**
 * GET /points/history
 * 获取积分历史
 */
app.get('/points/history', async (c) => {
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

  const history = await c.env.DB.prepare(`
    SELECT id, amount, reason, reference_id, created_at
    FROM points_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(user.id, limit, offset).all();

  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM points_history WHERE user_id = ?'
  ).bind(user.id).first();

  return c.json({
    success: true,
    data: history.results,
    meta: {
      page,
      limit,
      total: (total as any)?.count || 0,
    },
  });
});

export { app as userRoutes };
