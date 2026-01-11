/**
 * 用户 API 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';

describe('User API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // 模拟 /user/connect 端点
    app.post('/user/connect', async (c) => {
      const body = await c.req.json();
      const { wallet_address, chain, signature, message } = body;

      // 验证必要参数
      if (!wallet_address || !chain || !signature || !message) {
        return c.json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
        }, 400);
      }

      // 验证链类型
      const validChains = ['solana', 'base', 'ethereum', 'bnb'];
      if (!validChains.includes(chain)) {
        return c.json({
          success: false,
          error: { code: 'INVALID_CHAIN', message: 'Invalid chain type' },
        }, 400);
      }

      // 模拟成功响应
      return c.json({
        success: true,
        data: {
          user_id: 'test-user-123',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token',
          expires_at: Date.now() + 86400 * 1000,
        },
      });
    });

    // 模拟 /user/profile 端点
    app.get('/user/profile', async (c) => {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }, 401);
      }

      // 模拟用户数据
      return c.json({
        success: true,
        data: {
          id: 'test-user-123',
          wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
          total_points: 1500,
          reputation_score: 85,
          verification_level: 2,
          chains: [
            { chain: 'ethereum', chain_address: '0x1234...', verified_at: Date.now() },
            { chain: 'base', chain_address: '0x1234...', verified_at: Date.now() },
          ],
        },
      });
    });

    // 模拟 /user/verify-holding 端点
    app.post('/user/verify-holding', async (c) => {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader) {
        return c.json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }, 401);
      }

      const body = await c.req.json();
      const { chain, token_address } = body;

      if (!chain || !token_address) {
        return c.json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
        }, 400);
      }

      return c.json({
        success: true,
        data: {
          verified: true,
          balance: '1000000000000000000',
          points_earned: 100,
        },
      });
    });

    // 模拟 /user/points/history 端点
    app.get('/user/points/history', async (c) => {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader) {
        return c.json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        }, 401);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');

      return c.json({
        success: true,
        data: [
          { id: '1', amount: 100, reason: 'verify_holding', created_at: Date.now() },
          { id: '2', amount: 50, reason: 'referral', created_at: Date.now() - 86400000 },
        ],
        meta: {
          page,
          limit,
          total: 2,
        },
      });
    });
  });

  describe('POST /user/connect', () => {
    it('should connect wallet with valid params', async () => {
      const res = await app.request('/user/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
          chain: 'ethereum',
          signature: '0xsignature...',
          message: 'Sign to connect',
        }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user_id).toBeDefined();
      expect(data.data.token).toBeDefined();
    });

    it('should reject invalid chain', async () => {
      const res = await app.request('/user/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: '0x1234',
          chain: 'invalid_chain',
          signature: '0x...',
          message: 'test',
        }),
      });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_CHAIN');
    });

    it('should reject missing parameters', async () => {
      const res = await app.request('/user/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: '0x1234',
        }),
      });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_PARAMS');
    });
  });

  describe('GET /user/profile', () => {
    it('should return profile for authenticated user', async () => {
      const res = await app.request('/user/profile', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.wallet_address).toBeDefined();
      expect(data.data.total_points).toBeDefined();
      expect(data.data.chains).toBeInstanceOf(Array);
    });

    it('should reject unauthenticated request', async () => {
      const res = await app.request('/user/profile');
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /user/verify-holding', () => {
    it('should verify holding and award points', async () => {
      const res = await app.request('/user/verify-holding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          chain: 'ethereum',
          token_address: '0x1234567890abcdef1234567890abcdef12345678',
        }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.verified).toBe(true);
      expect(data.data.points_earned).toBeGreaterThan(0);
    });

    it('should reject unauthenticated request', async () => {
      const res = await app.request('/user/verify-holding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: 'ethereum',
          token_address: '0x1234',
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /user/points/history', () => {
    it('should return paginated points history', async () => {
      const res = await app.request('/user/points/history?page=1&limit=10', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.meta).toBeDefined();
      expect(data.meta.page).toBe(1);
      expect(data.meta.limit).toBe(10);
    });
  });
});
