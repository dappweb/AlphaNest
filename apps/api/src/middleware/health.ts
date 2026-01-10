/**
 * 健康检查端点
 */

import { Hono } from 'hono';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    latency?: number;
    message?: string;
  }[];
}

const startTime = Date.now();

export function createHealthRoutes() {
  const health = new Hono<{ Bindings: Env }>();

  // Basic health check
  health.get('/health', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Detailed health check
  health.get('/health/detailed', async (c) => {
    const checks: HealthStatus['checks'] = [];
    let overallStatus: HealthStatus['status'] = 'healthy';

    // Check D1 Database
    try {
      const dbStart = performance.now();
      await c.env.DB.prepare('SELECT 1').first();
      const dbLatency = Math.round(performance.now() - dbStart);
      
      checks.push({
        name: 'database',
        status: 'pass',
        latency: dbLatency,
      });
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      overallStatus = 'unhealthy';
    }

    // Check KV Cache
    try {
      const kvStart = performance.now();
      await c.env.CACHE.get('health-check-test');
      const kvLatency = Math.round(performance.now() - kvStart);
      
      checks.push({
        name: 'cache',
        status: 'pass',
        latency: kvLatency,
      });
    } catch (error) {
      checks.push({
        name: 'cache',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000),
      checks,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return c.json(response, statusCode);
  });

  // Readiness check
  health.get('/ready', async (c) => {
    try {
      await c.env.DB.prepare('SELECT 1').first();
      return c.json({ ready: true });
    } catch {
      return c.json({ ready: false }, 503);
    }
  });

  // Liveness check
  health.get('/live', (c) => {
    return c.json({ live: true });
  });

  return health;
}
