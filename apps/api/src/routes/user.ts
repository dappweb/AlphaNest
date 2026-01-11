/**
 * 用户模块路由
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { generateToken } from '../middleware/auth';
import { verifySignature } from '../utils/signature';

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

  // 验证签名
  const isValid = await verifySignature(wallet_address, signature, message, chain);
  if (!isValid) {
    return c.json({ 
      success: false, 
      error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } 
    }, 401);
  }

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

/**
 * GET /account/holdings
 * 获取用户持仓
 */
app.get('/account/holdings', async (c) => {
  const address = c.req.query('address');
  const chainId = parseInt(c.req.query('chainId') || '1');

  if (!address) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing address parameter' },
    }, 400);
  }

  // This endpoint can be used to get cached holdings
  // Real-time balances should use /blockchain/balance
  return c.json({
    success: true,
    data: [],
    message: 'Use /blockchain/balance for real-time balances',
  });
});

/**
 * GET /account/transactions
 * 获取用户交易历史
 */
app.get('/account/transactions', async (c) => {
  const address = c.req.query('address');
  const chainId = parseInt(c.req.query('chainId') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const page = parseInt(c.req.query('page') || '1');

  if (!address) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing address parameter' },
    }, 400);
  }

  try {
    // Check cache first
    const cacheKey = `tx_history:${chainId}:${address}:${page}`;
    const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
    
    if (cached) {
      return c.json({ success: true, data: cached });
    }

    // Fetch from database (if we have stored transactions)
    const storedTxs = await c.env.DB.prepare(`
      SELECT * FROM transactions 
      WHERE (from_address = ? OR to_address = ?) AND chain_id = ?
      ORDER BY block_number DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(address, address, chainId, limit, (page - 1) * limit).all();

    // If we have stored transactions, return them
    if (storedTxs.results && storedTxs.results.length > 0) {
      const txs = storedTxs.results.map((tx: any) => ({
        hash: tx.tx_hash,
        type: tx.type || 'send',
        status: tx.status || 'confirmed',
        timestamp: tx.created_at * 1000,
        from: tx.from_address,
        to: tx.to_address,
        value: tx.value,
        gasUsed: tx.gas_used,
        blockNumber: tx.block_number,
        tokenIn: tx.token_in ? JSON.parse(tx.token_in) : undefined,
        tokenOut: tx.token_out ? JSON.parse(tx.token_out) : undefined,
      }));

      // Cache for 1 minute
      await c.env.CACHE.put(cacheKey, JSON.stringify(txs), { expirationTtl: 60 });

      return c.json({ success: true, data: txs });
    }

    // Fallback: Try to fetch from RPC (limited, as most RPCs don't provide full history)
    // In production, use a service like Alchemy, Moralis, or The Graph
    const transactions: any[] = [];

    // Cache empty result for 5 minutes
    await c.env.CACHE.put(cacheKey, JSON.stringify(transactions), { expirationTtl: 300 });

    return c.json({
      success: true,
      data: transactions,
      message: 'No transactions found. Consider using a blockchain indexer for full history.',
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    return c.json({
      success: false,
      error: { code: 'TX_HISTORY_ERROR', message: 'Failed to fetch transaction history' },
    }, 500);
  }
});

/**
 * GET /:address/stats
 * 获取用户统计数据
 */
app.get('/:address/stats', async (c) => {
  const address = c.req.param('address');

  try {
    // Find user by address
    const user = await c.env.DB.prepare(
      'SELECT id, created_at FROM users WHERE wallet_address = ?'
    ).bind(address).first();

    if (!user) {
      return c.json({
        success: true,
        data: {
          totalTrades: 0,
          winRate: 0,
          totalVolume: 0,
          pointsBalance: 0,
          insurancePolicies: 0,
          memberSince: '',
        },
      });
    }

    // Get total trades
    const tradesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM trade_logs WHERE user_id = ?
    `).bind((user as any).id).first();
    const totalTrades = parseInt((tradesResult as any)?.count || '0');

    // Get total volume
    const volumeResult = await c.env.DB.prepare(`
      SELECT SUM(CAST(amount AS REAL)) as total FROM trade_logs WHERE user_id = ?
    `).bind((user as any).id).first();
    const totalVolume = parseFloat((volumeResult as any)?.total || '0');

    // Get points balance
    const pointsResult = await c.env.DB.prepare(
      'SELECT total_points FROM users WHERE id = ?'
    ).bind((user as any).id).first();
    const pointsBalance = parseInt((pointsResult as any)?.total_points || '0');

    // Get active insurance policies
    const policiesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM insurance_policies 
      WHERE user_id = ? AND status = 'active'
    `).bind((user as any).id).first();
    const insurancePolicies = parseInt((policiesResult as any)?.count || '0');

    // Calculate win rate from trade history
    const profitableTradesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM trade_logs 
      WHERE user_id = ? AND pnl > 0
    `).bind((user as any).id).first();
    const profitableTrades = parseInt((profitableTradesResult as any)?.count || '0');
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    // Format member since date
    const memberSince = (user as any).created_at
      ? new Date((user as any).created_at).toISOString().split('T')[0]
      : '';

    return c.json({
      success: true,
      data: {
        totalTrades,
        winRate,
        totalVolume,
        pointsBalance,
        insurancePolicies,
        memberSince,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch user stats' },
    }, 500);
  }
});

export { app as userRoutes };
