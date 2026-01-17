/**
 * 管理员模块路由
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { 
  adminAuthMiddleware, 
  requireRole, 
  requirePermission,
  generateAdminToken,
  hashToken as hashTokenAsync,
  logAdminAction,
} from '../middleware/admin-auth';
import { verifySignature } from '../utils/signature';
import { verifyMultipleContractAuthorities } from '../utils/solana-admin';

const app = new Hono();

// ============================================
// Schema 定义
// ============================================

const adminLoginSchema = z.object({
  wallet_address: z.string().min(20).max(64),
  chain: z.enum(['solana', 'base', 'ethereum', 'bnb']),
  signature: z.string(),
  message: z.string(),
});

const createAdminSchema = z.object({
  wallet_address: z.string().min(20).max(64),
  role: z.enum(['super_admin', 'admin', 'operator']),
  permissions: z.array(z.string()).optional(),
});

const updateAdminSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'operator']).optional(),
  permissions: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// 公开路由（无需认证）
// ============================================

/**
 * POST /admin/login
 * 管理员登录
 */
app.post('/login', zValidator('json', adminLoginSchema), async (c) => {
  const { wallet_address, chain, signature, message } = c.req.valid('json');
  const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';

  // 验证签名
  const isValid = await verifySignature(wallet_address, signature, message, chain);
  if (!isValid) {
    // 记录失败的登录尝试
    await c.env.DB.prepare(`
      INSERT INTO admin_login_attempts (id, wallet_address, ip_address, user_agent, success, attempted_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(nanoid(), wallet_address, ipAddress, userAgent, Math.floor(Date.now() / 1000)).run();

    return c.json({ 
      success: false, 
      error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } 
    }, 401);
  }

  // 查找管理员（数据库）
  let admin = await c.env.DB.prepare(`
    SELECT id, user_id, wallet_address, role, permissions, is_active, locked_until, failed_login_attempts
    FROM admins
    WHERE wallet_address = ?
  `).bind(wallet_address).first<{
    id: string;
    user_id: string;
    wallet_address: string;
    role: string;
    permissions: string;
    is_active: number;
    locked_until: number | null;
    failed_login_attempts: number;
  }>();

  // 如果数据库中没有找到，尝试从智能合约验证
  let isContractAdmin = false;
  if (!admin && chain === 'solana') {
    try {
      // 构建合约地址列表
      const contractAddresses: string[] = [];
      if (c.env.CONTRACT_STAKING_POOL) {
        contractAddresses.push(c.env.CONTRACT_STAKING_POOL);
      }
      if (c.env.CONTRACT_INSURANCE_PROTOCOL) {
        contractAddresses.push(c.env.CONTRACT_INSURANCE_PROTOCOL);
      }
      if (c.env.CONTRACT_REPUTATION_REGISTRY) {
        contractAddresses.push(c.env.CONTRACT_REPUTATION_REGISTRY);
      }
      if (c.env.CONTRACT_YIELD_VAULT) {
        contractAddresses.push(c.env.CONTRACT_YIELD_VAULT);
      }

      if (contractAddresses.length > 0) {
        isContractAdmin = await verifyMultipleContractAuthorities(
          c.env.SOLANA_RPC_URL,
          wallet_address,
          contractAddresses
        );
      }
      
      if (isContractAdmin) {
        // 合约管理员验证通过，创建数据库记录（可选）
        // 或者直接使用合约管理员身份登录
        
        // 查找或创建用户
        let user = await c.env.DB.prepare(
          'SELECT id FROM users WHERE wallet_address = ?'
        ).bind(wallet_address).first();

        if (!user) {
          const userId = nanoid();
          await c.env.DB.prepare(
            'INSERT INTO users (id, wallet_address) VALUES (?, ?)'
          ).bind(userId, wallet_address).run();
          user = { id: userId };
        }

        // 创建管理员记录（标记为合约管理员）
        const adminId = nanoid();
        await c.env.DB.prepare(`
          INSERT INTO admins (id, user_id, wallet_address, role, permissions, is_active, created_at, updated_at)
          VALUES (?, ?, ?, 'admin', ?, 1, ?, ?)
        `).bind(
          adminId,
          (user as any).id,
          wallet_address,
          JSON.stringify(['contract_admin']), // 标记为合约管理员
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000)
        ).run();

        // 重新查询管理员
        admin = await c.env.DB.prepare(`
          SELECT id, user_id, wallet_address, role, permissions, is_active, locked_until, failed_login_attempts
          FROM admins
          WHERE wallet_address = ?
        `).bind(wallet_address).first<{
          id: string;
          user_id: string;
          wallet_address: string;
          role: string;
          permissions: string;
          is_active: number;
          locked_until: number | null;
          failed_login_attempts: number;
        }>();
      }
    } catch (error) {
      console.error('Error verifying contract admin:', error);
      // 继续执行，如果合约验证失败，仍然检查数据库
    }
  }

  // 如果既不是数据库管理员也不是合约管理员
  if (!admin && !isContractAdmin) {
    // 记录失败的登录尝试
    await c.env.DB.prepare(`
      INSERT INTO admin_login_attempts (id, wallet_address, ip_address, user_agent, success, attempted_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(nanoid(), wallet_address, ipAddress, userAgent, Math.floor(Date.now() / 1000)).run();

    return c.json({ 
      success: false, 
      error: { code: 'ADMIN_NOT_FOUND', message: 'Admin account not found in database or contracts' } 
    }, 404);
  }

  // 检查账户状态
  if (admin.is_active === 0) {
    return c.json({ 
      success: false, 
      error: { code: 'ACCOUNT_INACTIVE', message: 'Admin account is inactive' } 
    }, 403);
  }

  // 检查账户是否被锁定
  if (admin.locked_until && admin.locked_until > Date.now() / 1000) {
    return c.json({ 
      success: false, 
      error: { 
        code: 'ACCOUNT_LOCKED', 
        message: `Account locked until ${new Date(admin.locked_until * 1000).toISOString()}` 
      } 
    }, 403);
  }

  // 解析权限
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(admin.permissions || '[]');
  } catch (e) {
    permissions = [];
  }

  // 生成 JWT Token
  const token = await generateAdminToken(
    admin.id,
    admin.wallet_address,
    admin.role,
    permissions,
    c.env.JWT_SECRET,
    '8h' // 管理员会话8小时
  );

  // 创建会话
  const sessionId = nanoid();
  const tokenHash = await hashTokenAsync(token);
  const expiresAt = Math.floor(Date.now() / 1000) + 8 * 3600; // 8小时

  await c.env.DB.prepare(`
    INSERT INTO admin_sessions (id, admin_id, token_hash, ip_address, user_agent, created_at, expires_at, last_activity_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sessionId,
    admin.id,
    tokenHash,
    ipAddress,
    userAgent,
    Math.floor(Date.now() / 1000),
    expiresAt,
    Math.floor(Date.now() / 1000)
  ).run();

  // 更新管理员最后登录信息
  await c.env.DB.prepare(`
    UPDATE admins
    SET last_login_at = ?, last_login_ip = ?, failed_login_attempts = 0, updated_at = ?
    WHERE id = ?
  `).bind(
    Math.floor(Date.now() / 1000),
    ipAddress,
    Math.floor(Date.now() / 1000),
    admin.id
  ).run();

  // 记录成功的登录尝试
  await c.env.DB.prepare(`
    INSERT INTO admin_login_attempts (id, wallet_address, ip_address, user_agent, success, attempted_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `).bind(nanoid(), wallet_address, ipAddress, userAgent, Math.floor(Date.now() / 1000)).run();

  // 记录操作日志
  await logAdminAction(c.env, admin.id, 'login', {
    ipAddress,
    userAgent,
    requestPath: '/admin/login',
    requestMethod: 'POST',
    status: 'success',
  });

  return c.json({
    success: true,
    data: {
      admin_id: admin.id,
      wallet: admin.wallet_address,
      role: admin.role,
      permissions,
      token,
      expires_at: expiresAt * 1000,
    },
  });
});

/**
 * POST /admin/logout
 * 管理员登出
 */
app.post('/logout', adminAuthMiddleware(), async (c) => {
  const admin = c.get('admin');
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7);

  if (token) {
    const tokenHash = await hashTokenAsync(token);
    // 删除会话
    await c.env.DB.prepare(`
      DELETE FROM admin_sessions
      WHERE admin_id = ? AND token_hash = ?
    `).bind(admin.id, tokenHash).run();
  }

  // 记录操作日志
  await logAdminAction(c.env, admin.id, 'logout', {
    requestPath: '/admin/logout',
    requestMethod: 'POST',
    status: 'success',
  });

  return c.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ============================================
// 需要认证的路由
// ============================================

/**
 * GET /admin/me
 * 获取当前管理员信息
 */
app.get('/me', adminAuthMiddleware(), async (c) => {
  const admin = c.get('admin');

  const adminData = await c.env.DB.prepare(`
    SELECT id, user_id, wallet_address, role, permissions, is_active, last_login_at, last_login_ip, created_at
    FROM admins
    WHERE id = ?
  `).bind(admin.id).first();

  let permissions: string[] = [];
  try {
    permissions = JSON.parse((adminData as any)?.permissions || '[]');
  } catch (e) {
    permissions = [];
  }

  return c.json({
    success: true,
    data: {
      ...adminData,
      permissions,
    },
  });
});

/**
 * GET /admin/check-permission
 * 检查管理员权限
 */
app.get('/check-permission', adminAuthMiddleware(), async (c) => {
  const admin = c.get('admin');
  const permission = c.req.query('permission');

  if (!permission) {
    return c.json({
      success: false,
      error: { code: 'MISSING_PARAM', message: 'Permission parameter is required' },
    }, 400);
  }

  const hasPermission = admin.role === 'super_admin' || 
    admin.permissions.includes(permission) || 
    admin.permissions.includes('*');

  return c.json({
    success: true,
    data: {
      has_permission: hasPermission,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
});

/**
 * GET /admin/audit-logs
 * 获取操作日志（需要管理员权限）
 */
app.get('/audit-logs', adminAuthMiddleware(), requireRole('super_admin', 'admin'), async (c) => {
  const admin = c.get('admin');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const action = c.req.query('action');
  const adminId = c.req.query('admin_id');

  let query = `
    SELECT 
      aal.id, aal.admin_id, aal.action, aal.entity_type, aal.entity_id,
      aal.old_data, aal.new_data, aal.ip_address, aal.user_agent,
      aal.request_path, aal.request_method, aal.status, aal.error_message,
      aal.created_at,
      a.wallet_address as admin_wallet, a.role as admin_role
    FROM admin_audit_logs aal
    LEFT JOIN admins a ON aal.admin_id = a.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (action) {
    query += ' AND aal.action = ?';
    params.push(action);
  }

  if (adminId) {
    query += ' AND aal.admin_id = ?';
    params.push(adminId);
  }

  query += ' ORDER BY aal.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = await c.env.DB.prepare(query).bind(...params).all();

  const totalResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM admin_audit_logs
  `).first<{ count: number }>();

  return c.json({
    success: true,
    data: logs.results,
    meta: {
      page,
      limit,
      total: totalResult?.count || 0,
    },
  });
});

/**
 * GET /admin/admins
 * 获取管理员列表（仅超级管理员）
 */
app.get('/admins', adminAuthMiddleware(), requireRole('super_admin'), async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const admins = await c.env.DB.prepare(`
    SELECT id, user_id, wallet_address, role, permissions, is_active, 
           last_login_at, last_login_ip, created_at, created_by
    FROM admins
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const totalResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM admins
  `).first<{ count: number }>();

  return c.json({
    success: true,
    data: admins.results,
    meta: {
      page,
      limit,
      total: totalResult?.count || 0,
    },
  });
});

/**
 * POST /admin/admins
 * 创建新管理员（仅超级管理员）
 */
app.post('/admins', adminAuthMiddleware(), requireRole('super_admin'), 
  zValidator('json', createAdminSchema), async (c) => {
  const admin = c.get('admin');
  const { wallet_address, role, permissions } = c.req.valid('json');

  // 检查钱包是否已存在管理员
  const existing = await c.env.DB.prepare(`
    SELECT id FROM admins WHERE wallet_address = ?
  `).bind(wallet_address).first();

  if (existing) {
    return c.json({
      success: false,
      error: { code: 'ADMIN_EXISTS', message: 'Admin with this wallet address already exists' },
    }, 400);
  }

  // 查找或创建用户
  let user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE wallet_address = ?'
  ).bind(wallet_address).first();

  if (!user) {
    const userId = nanoid();
    await c.env.DB.prepare(
      'INSERT INTO users (id, wallet_address) VALUES (?, ?)'
    ).bind(userId, wallet_address).run();
    user = { id: userId };
  }

  // 创建管理员
  const adminId = nanoid();
  await c.env.DB.prepare(`
    INSERT INTO admins (id, user_id, wallet_address, role, permissions, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    adminId,
    (user as any).id,
    wallet_address,
    role,
    JSON.stringify(permissions || []),
    admin.id,
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000)
  ).run();

  // 记录操作日志
  await logAdminAction(c.env, admin.id, 'create_admin', {
    entityType: 'admin',
    entityId: adminId,
    newData: { wallet_address, role, permissions },
    requestPath: '/admin/admins',
    requestMethod: 'POST',
    status: 'success',
  });

  return c.json({
    success: true,
    data: {
      id: adminId,
      wallet_address,
      role,
      permissions: permissions || [],
    },
  }, 201);
});

/**
 * PATCH /admin/admins/:id
 * 更新管理员信息（仅超级管理员）
 */
app.patch('/admins/:id', adminAuthMiddleware(), requireRole('super_admin'),
  zValidator('json', updateAdminSchema), async (c) => {
  const currentAdmin = c.get('admin');
  const adminId = c.req.param('id');
  const updates = c.req.valid('json');

  // 获取当前管理员数据
  const existing = await c.env.DB.prepare(`
    SELECT * FROM admins WHERE id = ?
  `).bind(adminId).first<{
    id: string;
    wallet_address: string;
    role: string;
    permissions: string;
    is_active: number;
  }>();

  if (!existing) {
    return c.json({
      success: false,
      error: { code: 'ADMIN_NOT_FOUND', message: 'Admin not found' },
    }, 404);
  }

  // 构建更新语句
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.role !== undefined) {
    updateFields.push('role = ?');
    updateValues.push(updates.role);
  }

  if (updates.permissions !== undefined) {
    updateFields.push('permissions = ?');
    updateValues.push(JSON.stringify(updates.permissions));
  }

  if (updates.is_active !== undefined) {
    updateFields.push('is_active = ?');
    updateValues.push(updates.is_active ? 1 : 0);
  }

  if (updateFields.length === 0) {
    return c.json({
      success: false,
      error: { code: 'NO_UPDATES', message: 'No fields to update' },
    }, 400);
  }

  updateFields.push('updated_at = ?');
  updateValues.push(Math.floor(Date.now() / 1000));
  updateValues.push(adminId);

  await c.env.DB.prepare(`
    UPDATE admins
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `).bind(...updateValues).run();

  // 记录操作日志
  await logAdminAction(c.env, currentAdmin.id, 'update_admin', {
    entityType: 'admin',
    entityId: adminId,
    oldData: {
      role: existing.role,
      permissions: JSON.parse(existing.permissions || '[]'),
      is_active: existing.is_active === 1,
    },
    newData: updates,
    requestPath: `/admin/admins/${adminId}`,
    requestMethod: 'PATCH',
    status: 'success',
  });

  return c.json({
    success: true,
    message: 'Admin updated successfully',
  });
});

export { app as adminRoutes };
