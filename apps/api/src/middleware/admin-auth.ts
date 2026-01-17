/**
 * 管理员认证中间件
 * 验证管理员权限并注入管理员信息
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as jose from 'jose';

interface AdminJWTPayload {
  sub: string;  // admin_id
  wallet: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

declare module 'hono' {
  interface ContextVariableMap {
    admin: {
      id: string;
      user_id: string;
      wallet: string;
      role: string;
      permissions: string[];
    };
  }
}

/**
 * 管理员认证中间件
 * 验证管理员 JWT Token 并检查权限
 */
export function adminAuthMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, {
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.slice(7);

    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret) as { payload: AdminJWTPayload };

      // 检查 token 是否过期
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new HTTPException(401, { message: 'Token expired' });
      }

      // 验证管理员会话
      const sessionKey = `admin_session:${payload.sub}`;
      const session = await c.env.SESSIONS.get(sessionKey);

      if (!session) {
        throw new HTTPException(401, { message: 'Session expired or invalid' });
      }

      // 从数据库验证管理员状态
      const admin = await c.env.DB.prepare(`
        SELECT id, user_id, wallet_address, role, permissions, is_active, locked_until
        FROM admins
        WHERE id = ? AND is_active = 1
      `).bind(payload.sub).first<{
        id: string;
        user_id: string;
        wallet_address: string;
        role: string;
        permissions: string;
        is_active: number;
        locked_until: number | null;
      }>();

      if (!admin) {
        throw new HTTPException(403, { message: 'Admin account not found or inactive' });
      }

      // 检查账户是否被锁定
      if (admin.locked_until && admin.locked_until > Date.now() / 1000) {
        throw new HTTPException(403, { 
          message: `Account locked until ${new Date(admin.locked_until * 1000).toISOString()}` 
        });
      }

      // 解析权限
      let permissions: string[] = [];
      try {
        permissions = JSON.parse(admin.permissions || '[]');
      } catch (e) {
        permissions = [];
      }

      // 注入管理员信息到上下文
      c.set('admin', {
        id: admin.id,
        user_id: admin.user_id,
        wallet: admin.wallet_address,
        role: admin.role,
        permissions,
      });

      // 更新最后活动时间
      const tokenHash = await hashToken(token);
      await c.env.DB.prepare(`
        UPDATE admin_sessions
        SET last_activity_at = ?
        WHERE admin_id = ? AND token_hash = ?
      `).bind(
        Math.floor(Date.now() / 1000),
        admin.id,
        tokenHash
      ).run();

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error('Admin auth error:', error);
      throw new HTTPException(401, { message: 'Invalid admin token' });
    }
  };
}

/**
 * 角色检查中间件
 * 检查管理员是否具有指定角色
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const admin = c.get('admin');
    
    if (!admin) {
      throw new HTTPException(401, { message: 'Admin authentication required' });
    }

    if (!roles.includes(admin.role)) {
      throw new HTTPException(403, { 
        message: `Required role: ${roles.join(' or ')}, but got: ${admin.role}` 
      });
    }

    await next();
  };
}

/**
 * 权限检查中间件
 * 检查管理员是否具有指定权限
 */
export function requirePermission(...permissions: string[]) {
  return async (c: Context, next: Next) => {
    const admin = c.get('admin');
    
    if (!admin) {
      throw new HTTPException(401, { message: 'Admin authentication required' });
    }

    // 超级管理员拥有所有权限
    if (admin.role === 'super_admin') {
      await next();
      return;
    }

    // 检查是否具有所需权限
    const hasPermission = permissions.some(perm => 
      admin.permissions.includes(perm) || 
      admin.permissions.includes('*') // 通配符权限
    );

    if (!hasPermission) {
      throw new HTTPException(403, { 
        message: `Required permission: ${permissions.join(' or ')}` 
      });
    }

    await next();
  };
}

/**
 * 生成管理员 JWT Token
 */
export async function generateAdminToken(
  adminId: string,
  wallet: string,
  role: string,
  permissions: string[],
  secret: string,
  expiresIn: string = '8h'
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);

  const token = await new jose.SignJWT({
    sub: adminId,
    wallet,
    role,
    permissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}

/**
 * 哈希 Token（用于存储）
 * 使用 Web Crypto API（兼容 Cloudflare Workers）
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 记录管理员操作日志
 */
export async function logAdminAction(
  env: any,
  adminId: string,
  action: string,
  options: {
    entityType?: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    requestMethod?: string;
    status?: 'success' | 'failed' | 'error';
    errorMessage?: string;
  }
): Promise<void> {
  const { nanoid } = await import('nanoid');
  
  try {
    await env.DB.prepare(`
      INSERT INTO admin_audit_logs (
        id, admin_id, action, entity_type, entity_id,
        old_data, new_data, ip_address, user_agent,
        request_path, request_method, status, error_message,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nanoid(),
      adminId,
      action,
      options.entityType || null,
      options.entityId || null,
      options.oldData ? JSON.stringify(options.oldData) : null,
      options.newData ? JSON.stringify(options.newData) : null,
      options.ipAddress || null,
      options.userAgent || null,
      options.requestPath || null,
      options.requestMethod || null,
      options.status || 'success',
      options.errorMessage || null,
      Math.floor(Date.now() / 1000)
    ).run();
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // 不抛出错误，避免影响主流程
  }
}
