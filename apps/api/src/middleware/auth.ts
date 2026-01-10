/**
 * 认证中间件
 * 验证 JWT Token 并注入用户信息
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as jose from 'jose';

interface JWTPayload {
  sub: string;  // user_id
  wallet: string;
  chains: string[];
  iat: number;
  exp: number;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string;
      wallet: string;
      chains: string[];
    };
  }
}

export function authMiddleware() {
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
      const { payload } = await jose.jwtVerify(token, secret) as { payload: JWTPayload };

      // 检查 token 是否过期
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new HTTPException(401, { message: 'Token expired' });
      }

      // 验证会话是否有效 (可选: 检查 KV 中的会话)
      const sessionKey = `session:${payload.sub}`;
      const session = await c.env.SESSIONS.get(sessionKey);

      if (!session) {
        throw new HTTPException(401, { message: 'Session expired or invalid' });
      }

      // 注入用户信息到上下文
      c.set('user', {
        id: payload.sub,
        wallet: payload.wallet,
        chains: payload.chains || [],
      });

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error('Auth error:', error);
      throw new HTTPException(401, { message: 'Invalid token' });
    }
  };
}

/**
 * 生成 JWT Token
 */
export async function generateToken(
  userId: string,
  wallet: string,
  chains: string[],
  secret: string,
  expiresIn: string = '24h'
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);

  const token = await new jose.SignJWT({
    sub: userId,
    wallet,
    chains,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}

/**
 * 可选认证中间件 (不强制要求登录)
 */
export function optionalAuthMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      try {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret) as { payload: JWTPayload };

        c.set('user', {
          id: payload.sub,
          wallet: payload.wallet,
          chains: payload.chains || [],
        });
      } catch (error) {
        // 忽略无效 token，继续处理请求
      }
    }

    await next();
  };
}
