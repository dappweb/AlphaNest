/**
 * Referral System 推荐系统路由
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const app = new Hono();

/**
 * GET /stats
 * 获取推荐统计
 */
app.get('/stats', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }, 401);
  }

  try {
    // Get or create referral code
    let referral = await c.env.DB.prepare(
      'SELECT * FROM referrals WHERE referrer_id = ?'
    ).bind(user.id).first();

    if (!referral) {
      // Generate referral code
      const code = generateReferralCode(user.wallet_address || user.id);
      await c.env.DB.prepare(`
        INSERT INTO referrals (id, referrer_id, referral_code, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(nanoid(), user.id, code, Date.now(), Date.now()).run();

      referral = await c.env.DB.prepare(
        'SELECT * FROM referrals WHERE referrer_id = ?'
      ).bind(user.id).first();
    }

    // Get referral stats
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_referrals,
        SUM(CAST(reward_amount AS REAL)) as total_earnings,
        SUM(CASE WHEN status = 'pending' THEN CAST(reward_amount AS REAL) ELSE 0 END) as pending_earnings
      FROM referral_records
      WHERE referrer_id = ?
    `).bind(user.id).first();

    const baseUrl = c.req.header('Origin') || 'https://alphanest-web-9w8.pages.dev';
    const referralLink = `${baseUrl}/?ref=${(referral as any).referral_code}`;

    return c.json({
      success: true,
      data: {
        totalReferrals: (stats as any)?.total_referrals || 0,
        activeReferrals: (stats as any)?.active_referrals || 0,
        totalEarnings: parseFloat((stats as any)?.total_earnings || '0'),
        pendingEarnings: parseFloat((stats as any)?.pending_earnings || '0'),
        referralCode: (referral as any).referral_code,
        referralLink,
      },
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch referral stats' },
    }, 500);
  }
});

/**
 * GET /history
 * 获取推荐历史记录
 */
app.get('/history', async (c) => {
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

  try {
    const records = await c.env.DB.prepare(`
      SELECT 
        id,
        referee_id,
        referee_address,
        status,
        reward_amount as earnings,
        trades_count as trades,
        created_at as referredAt
      FROM referral_records
      WHERE referrer_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const mappedRecords = (records.results || []).map((r: any) => ({
      id: r.id,
      referredAddress: r.referee_address,
      referredAt: r.referredAt,
      status: r.status,
      earnings: parseFloat(r.earnings || '0'),
      trades: parseInt(r.trades_count || '0'),
    }));

    return c.json({
      success: true,
      data: mappedRecords,
      meta: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching referral history:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch referral history' },
    }, 500);
  }
});

/**
 * GET /leaderboard
 * 获取推荐排行榜
 */
app.get('/leaderboard', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  try {
    const leaderboard = await c.env.DB.prepare(`
      SELECT 
        r.referrer_id,
        u.wallet_address as address,
        COUNT(rr.id) as referrals,
        SUM(CAST(rr.reward_amount AS REAL)) as earnings,
        CASE 
          WHEN COUNT(rr.id) >= 500 THEN 'Diamond'
          WHEN COUNT(rr.id) >= 100 THEN 'Platinum'
          WHEN COUNT(rr.id) >= 50 THEN 'Gold'
          WHEN COUNT(rr.id) >= 15 THEN 'Silver'
          WHEN COUNT(rr.id) >= 5 THEN 'Bronze'
          ELSE 'Starter'
        END as tier
      FROM referrals r
      INNER JOIN users u ON r.referrer_id = u.id
      LEFT JOIN referral_records rr ON r.referrer_id = rr.referrer_id
      GROUP BY r.referrer_id, u.wallet_address
      ORDER BY referrals DESC, earnings DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return c.json({
      success: true,
      data: (leaderboard.results || []).map((entry: any) => ({
        address: entry.address,
        referrals: parseInt(entry.referrals || '0'),
        earnings: parseFloat(entry.earnings || '0'),
        tier: entry.tier,
      })),
      meta: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch leaderboard' },
    }, 500);
  }
});

/**
 * POST /register
 * 注册推荐关系（当新用户通过推荐链接注册时调用）
 */
app.post('/register', async (c) => {
  const body = await c.req.json();
  const { referralCode, refereeAddress } = body;

  if (!referralCode || !refereeAddress) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing referral code or referee address' },
    }, 400);
  }

  try {
    // Find referrer by code
    const referrer = await c.env.DB.prepare(`
      SELECT r.*, u.id as user_id
      FROM referrals r
      INNER JOIN users u ON r.referrer_id = u.id
      WHERE r.referral_code = ?
    `).bind(referralCode).first();

    if (!referrer) {
      return c.json({
        success: false,
        error: { code: 'INVALID_CODE', message: 'Invalid referral code' },
      }, 404);
    }

    // Check if referee already exists
    const existingReferee = await c.env.DB.prepare(
      'SELECT id FROM users WHERE wallet_address = ?'
    ).bind(refereeAddress).first();

    let refereeId: string;
    if (existingReferee) {
      refereeId = (existingReferee as any).id;
    } else {
      // Create new user for referee
      refereeId = nanoid();
      await c.env.DB.prepare(`
        INSERT INTO users (id, wallet_address, created_at)
        VALUES (?, ?, ?)
      `).bind(refereeId, refereeAddress, Date.now()).run();
    }

    // Check if referral relationship already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM referral_records 
      WHERE referrer_id = ? AND referee_id = ?
    `).bind((referrer as any).user_id, refereeId).first();

    if (existing) {
      return c.json({
        success: true,
        data: { message: 'Referral relationship already exists' },
      });
    }

    // Create referral record
    const recordId = nanoid();
    await c.env.DB.prepare(`
      INSERT INTO referral_records (
        id, referrer_id, referee_id, referee_address, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      recordId,
      (referrer as any).user_id,
      refereeId,
      refereeAddress,
      'pending',
      Date.now()
    ).run();

    return c.json({
      success: true,
      data: {
        recordId,
        referrerId: (referrer as any).user_id,
        refereeId,
      },
    });
  } catch (error) {
    console.error('Error registering referral:', error);
    return c.json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to register referral' },
    }, 500);
  }
});

/**
 * Helper function to generate referral code
 */
function generateReferralCode(address: string): string {
  const prefix = address.slice(2, 6).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export { app as referralRoutes };
