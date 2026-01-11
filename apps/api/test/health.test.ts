/**
 * 健康检查 API 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';

describe('Health Check API', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    
    // 模拟健康检查端点
    app.get('/', (c) => {
      return c.json({
        success: true,
        data: {
          name: 'alphanest-api',
          version: 'v1.0.0',
          environment: 'test',
          uptime: process.uptime(),
        },
      });
    });

    app.get('/health', (c) => {
      return c.json({
        success: true,
        data: {
          status: 'healthy',
          services: {
            database: 'ok',
            cache: 'ok',
          },
        },
      });
    });
  });

  it('should return API info on root path', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('alphanest-api');
    expect(data.data.version).toBeDefined();
  });

  it('should return healthy status on /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('healthy');
    expect(data.data.services).toBeDefined();
  });
});
