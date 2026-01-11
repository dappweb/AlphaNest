/**
 * 保险 API 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';

describe('Insurance API', () => {
  let app: Hono;
  let mockDb: any;

  beforeEach(() => {
    // Mock 数据
    const mockProducts = [
      {
        token_address: '0x1234567890abcdef1234567890abcdef12345678',
        token_symbol: 'TEST',
        chain: 'base',
        market_cap: '1000000',
        premium_rate: 0.05,
        total_rug_stake: '100000',
        total_safe_stake: '200000',
        closes_at: Date.now() + 86400000,
      },
    ];

    mockDb = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: mockProducts }),
          first: async () => mockProducts[0],
        }),
      }),
    };

    app = new Hono();

    // 模拟 /insurance/products 端点
    app.get('/insurance/products', async (c) => {
      const chain = c.req.query('chain');
      let products = mockProducts;
      
      if (chain) {
        products = products.filter(p => p.chain === chain);
      }

      const data = products.map((p) => {
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
          expiry_options: [3600, 86400, 604800],
        };
      });

      return c.json({ success: true, data });
    });

    app.get('/insurance/products/:token_address', async (c) => {
      const tokenAddress = c.req.param('token_address');
      const product = mockProducts.find(p => p.token_address === tokenAddress);

      if (!product) {
        return c.json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Insurance product not found' },
        }, 404);
      }

      return c.json({ success: true, data: product });
    });

    app.post('/insurance/purchase', async (c) => {
      const body = await c.req.json();
      const { token_address, coverage_amount, position, expiry_seconds } = body;

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

      // 模拟成功响应
      return c.json({
        success: true,
        data: {
          policy_id: 'test-policy-123',
          premium_paid: (BigInt(coverage_amount) * BigInt(5) / BigInt(100)).toString(),
          coverage: coverage_amount,
          potential_payout: (BigInt(coverage_amount) * BigInt(2)).toString(),
          expires_at: Date.now() + expiry_seconds * 1000,
        },
      });
    });
  });

  describe('GET /insurance/products', () => {
    it('should return list of insurance products', async () => {
      const res = await app.request('/insurance/products');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should filter products by chain', async () => {
      const res = await app.request('/insurance/products?chain=base');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      data.data.forEach((product: any) => {
        expect(product.chain).toBe('base');
      });
    });

    it('should include odds calculation', async () => {
      const res = await app.request('/insurance/products');
      const data = await res.json();

      expect(data.data[0].current_odds).toBeDefined();
      expect(data.data[0].current_odds.rug).toBeDefined();
      expect(data.data[0].current_odds.safe).toBeDefined();
    });
  });

  describe('GET /insurance/products/:token_address', () => {
    it('should return product details for valid address', async () => {
      const res = await app.request('/insurance/products/0x1234567890abcdef1234567890abcdef12345678');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.token_address).toBe('0x1234567890abcdef1234567890abcdef12345678');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await app.request('/insurance/products/0x0000000000000000000000000000000000000000');
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /insurance/purchase', () => {
    it('should purchase insurance with valid params', async () => {
      const res = await app.request('/insurance/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_address: '0x1234567890abcdef1234567890abcdef12345678',
          coverage_amount: '1000000000000000000',
          position: 'rug',
          expiry_seconds: 86400,
          chain: 'base',
        }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.policy_id).toBeDefined();
      expect(data.data.premium_paid).toBeDefined();
    });

    it('should reject invalid position', async () => {
      const res = await app.request('/insurance/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_address: '0x1234',
          coverage_amount: '1000000',
          position: 'invalid',
          expiry_seconds: 86400,
        }),
      });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_POSITION');
    });

    it('should reject missing parameters', async () => {
      const res = await app.request('/insurance/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_address: '0x1234',
        }),
      });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_PARAMS');
    });
  });
});
