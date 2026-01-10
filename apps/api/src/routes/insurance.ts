/**
 * 保险模块路由 (AlphaGuard)
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * GET /products
 * 可投保代币列表
 */
app.get('/products', async (c) => {
  const chain = c.req.query('chain');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      t.contract_address as token_address,
      t.symbol as token_symbol,
      t.chain,
      t.market_cap,
      p.premium_rate,
      p.total_rug_stake,
      p.total_safe_stake,
      p.closes_at
    FROM insurance_pools p
    INNER JOIN tokens t ON p.token_id = t.id
    WHERE p.status = 'active'
  `;

  if (chain) {
    query += ` AND t.chain = '${chain}'`;
  }

  query += ` ORDER BY t.market_cap DESC LIMIT ? OFFSET ?`;

  const products = await c.env.DB.prepare(query).bind(limit, offset).all();

  // 计算赔率
  const data = products.results?.map((p: any) => {
    const totalStake = BigInt(p.total_rug_stake || '0') + BigInt(p.total_safe_stake || '0');
    const rugOdds = totalStake > 0 
      ? Number(totalStake) / Number(BigInt(p.total_rug_stake || '1'))
      : 2;
    const safeOdds = totalStake > 0
      ? Number(totalStake) / Number(BigInt(p.total_safe_stake || '1'))
      : 2;

    return {
      ...p,
      pool_size: totalStake.toString(),
      current_odds: { rug: rugOdds.toFixed(2), safe: safeOdds.toFixed(2) },
      expiry_options: [3600, 86400, 604800], // 1h, 1d, 7d
    };
  }) || [];

  return c.json({ success: true, data });
});

/**
 * GET /products/:token_address
 * 获取单个代币的保险详情
 */
app.get('/products/:token_address', async (c) => {
  const tokenAddress = c.req.param('token_address');
  const chain = c.req.query('chain') || 'base';

  const product = await c.env.DB.prepare(`
    SELECT 
      t.contract_address as token_address,
      t.name as token_name,
      t.symbol as token_symbol,
      t.chain,
      t.market_cap,
      t.holder_count,
      d.wallet_address as dev_address,
      d.score as dev_score,
      p.premium_rate,
      p.total_rug_stake,
      p.total_safe_stake,
      p.closes_at,
      p.status
    FROM insurance_pools p
    INNER JOIN tokens t ON p.token_id = t.id
    LEFT JOIN devs d ON t.creator_dev_id = d.id
    WHERE t.contract_address = ? AND t.chain = ?
  `).bind(tokenAddress, chain).first();

  if (!product) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Insurance product not found' },
    }, 404);
  }

  return c.json({ success: true, data: product });
});

/**
 * POST /purchase
 * 购买保险
 */
app.post('/purchase', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const body = await c.req.json();
  const { token_address, chain, coverage_amount, expiry_seconds, position } = body;

  // 验证参数
  if (!token_address || !coverage_amount || !expiry_seconds || !position) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  if (!['rug', 'safe'].includes(position)) {
    return c.json({
      success: false,
      error: { code: 'INVALID_POSITION', message: 'Position must be "rug" or "safe"' },
    }, 400);
  }

  // 获取保险池
  const pool = await c.env.DB.prepare(`
    SELECT p.id, p.token_id, p.premium_rate, p.status
    FROM insurance_pools p
    INNER JOIN tokens t ON p.token_id = t.id
    WHERE t.contract_address = ? AND t.chain = ? AND p.status = 'active'
  `).bind(token_address, chain || 'base').first();

  if (!pool) {
    return c.json({
      success: false,
      error: { code: 'POOL_NOT_FOUND', message: 'Insurance pool not found or closed' },
    }, 404);
  }

  // 计算保费
  const premiumRate = (pool as any).premium_rate || 0.05;
  const premium = BigInt(coverage_amount) * BigInt(Math.floor(premiumRate * 10000)) / BigInt(10000);

  // TODO: 调用智能合约执行购买
  // const tx = await executeInsurancePurchase(...)

  // 创建保单记录
  const policyId = nanoid();
  const expiresAt = Date.now() + expiry_seconds * 1000;

  await c.env.DB.prepare(`
    INSERT INTO insurance_policies (
      id, user_id, token_id, position, premium_paid, 
      coverage_amount, potential_payout, chain, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    policyId,
    user.id,
    (pool as any).token_id,
    position,
    premium.toString(),
    coverage_amount,
    (BigInt(coverage_amount) * BigInt(2)).toString(), // 模拟 2x 赔付
    chain || 'base',
    expiresAt
  ).run();

  return c.json({
    success: true,
    data: {
      policy_id: policyId,
      premium_paid: premium.toString(),
      coverage: coverage_amount,
      potential_payout: (BigInt(coverage_amount) * BigInt(2)).toString(),
      expires_at: expiresAt,
      tx_hash: '0x...', // TODO: 返回实际交易哈希
    },
  });
});

/**
 * GET /policies
 * 获取用户保单列表
 */
app.get('/policies', async (c) => {
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
      p.id as policy_id,
      p.position,
      p.premium_paid,
      p.coverage_amount,
      p.potential_payout,
      p.status,
      p.expires_at,
      p.payout_amount,
      t.contract_address as token_address,
      t.symbol as token_symbol,
      t.chain
    FROM insurance_policies p
    INNER JOIN tokens t ON p.token_id = t.id
    WHERE p.user_id = ?
  `;

  if (status) {
    query += ` AND p.status = '${status}'`;
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;

  const policies = await c.env.DB.prepare(query).bind(user.id, limit, offset).all();

  return c.json({ success: true, data: policies.results });
});

/**
 * POST /claim
 * 发起理赔
 */
app.post('/claim', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  const { policy_id } = await c.req.json();

  // 获取保单
  const policy = await c.env.DB.prepare(`
    SELECT * FROM insurance_policies WHERE id = ? AND user_id = ?
  `).bind(policy_id, user.id).first();

  if (!policy) {
    return c.json({
      success: false,
      error: { code: 'POLICY_NOT_FOUND', message: 'Policy not found' },
    }, 404);
  }

  if ((policy as any).status !== 'active') {
    return c.json({
      success: false,
      error: { code: 'INVALID_STATUS', message: 'Policy is not active' },
    }, 400);
  }

  // TODO: 验证 Rug 事件并执行理赔
  // const isRugged = await checkRugStatus(...)

  return c.json({
    success: true,
    data: {
      policy_id,
      claim_status: 'pending_verification',
      message: 'Claim submitted for verification',
    },
  });
});

export { app as insuranceRoutes };
