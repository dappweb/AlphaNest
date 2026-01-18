/**
 * AlphaNest API - Cloudflare Workers Entry Point
 * 
 * 基于 Hono 框架构建的 Serverless API
 * 部署平台: Cloudflare Workers
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import * as Sentry from '@sentry/cloudflare';

// 路由模块
import { userRoutes } from './routes/user';
import { devRoutes } from './routes/dev';
import { tradeRoutes } from './routes/trade';
import { insuranceRoutes } from './routes/insurance';
import { tokenRoutes } from './routes/tokens';
import { webhookRoutes } from './routes/webhooks';
import { blockchainRoutes } from './routes/blockchain';
import { traderRoutes } from './routes/traders';
import { analyticsRoutes } from './routes/analytics';
import { referralRoutes } from './routes/referral';
import { notificationRoutes } from './routes/notifications';
import { botRoutes } from './routes/bots';
import { memeRoutes } from './routes/meme';
// 项目已简化为仅支持 Solana/pump.fun，已移除 sniper 和 whale-alert 功能
// import { sniperRoutes } from './routes/sniper';
// import { whaleAlertRoutes } from './routes/whale-alert';
import { adminRoutes } from './routes/admin';

// 中间件
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { geoBlockMiddleware } from './middleware/geo-block';

// 类型定义
export interface Env {
  // D1 数据库
  DB: D1Database;

  // KV 命名空间
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;

  // R2 存储 (可选)
  ASSETS?: R2Bucket;

  // Queues (可选)
  TASK_QUEUE?: Queue;
  NOTIFICATION_QUEUE?: Queue;

  // Durable Objects
  WEBSOCKET_SERVER: DurableObjectNamespace;

  // 环境变量
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  API_VERSION: string;
  CORS_ORIGIN: string;

  // RPC 节点
  SOLANA_RPC_URL: string;
  BASE_RPC_URL: string;
  ETH_RPC_URL: string;

  // API 密钥
  BITQUERY_API_KEY: string;
  COVALENT_API_KEY: string;
  DEXSCREENER_API_KEY: string;
  BIRDEYE_API_KEY: string;

  // 安全
  JWT_SECRET: string;

  // 合约地址
  CONTRACT_ALPHANEST_CORE: string;
  CONTRACT_REPUTATION_REGISTRY: string;
  CONTRACT_ALPHAGUARD: string;
  
  // Solana 合约地址（用于管理员验证）
  CONTRACT_STAKING_POOL?: string;
  CONTRACT_INSURANCE_PROTOCOL?: string;
  CONTRACT_YIELD_VAULT?: string;
  CONTRACT_STAKING_PROGRAM_ID?: string;
  CONTRACT_INSURANCE_PROGRAM_ID?: string;
  CONTRACT_REPUTATION_PROGRAM_ID?: string;
  CONTRACT_VAULT_PROGRAM_ID?: string;

  // Sentry
  SENTRY_DSN: string;
}

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// ============================================
// 全局中间件
// ============================================

// CORS 配置
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      c.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:8787',
    ];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400,
  credentials: true,
}));

// 安全头
app.use('*', secureHeaders());

// 请求日志
app.use('*', logger());

// JSON 美化 (开发环境)
app.use('*', prettyJSON());

// 地理围栏 (阻止受限地区)
app.use('/api/*', geoBlockMiddleware());

// Rate Limiting
app.use('/api/*', rateLimitMiddleware());

// ============================================
// 健康检查
// ============================================

app.get('/', (c) => {
  return c.json({
    name: 'AlphaNest API',
    version: c.env.API_VERSION,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (c) => {
  const checks = {
    api: 'ok',
    database: 'unknown',
    cache: 'unknown',
  };

  // 检查数据库连接
  try {
    await c.env.DB.prepare('SELECT 1').first();
    checks.database = 'ok';
  } catch (e) {
    checks.database = 'error';
  }

  // 检查 KV 连接
  try {
    await c.env.CACHE.get('health-check');
    checks.cache = 'ok';
  } catch (e) {
    checks.cache = 'error';
  }

  const allHealthy = Object.values(checks).every(v => v === 'ok');

  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  }, allHealthy ? 200 : 503);
});

// ============================================
// API 路由
// ============================================

// API v1 路由组
const api = new Hono<{ Bindings: Env }>();

// 公开路由 (无需认证)
api.route('/user', userRoutes);
api.route('/dev', devRoutes);
api.route('/developers', devRoutes); // Alias for developers/rankings
api.route('/tokens', tokenRoutes);
api.route('/blockchain', blockchainRoutes);
api.route('/traders', traderRoutes);
api.route('/analytics', analyticsRoutes);
api.route('/platform', analyticsRoutes); // Alias for platform/stats
api.route('/meme', memeRoutes);
api.route('/insurance', insuranceRoutes);
api.route('/activity', analyticsRoutes); // Alias for activity/recent
api.route('/admin', adminRoutes);

// 需要认证的路由
api.use('/trade/*', authMiddleware());
api.use('/insurance/purchase', authMiddleware());
api.use('/insurance/policies', authMiddleware());
api.use('/insurance/claim', authMiddleware());
api.use('/copy-trades/*', authMiddleware());
api.use('/referral/*', authMiddleware());
api.use('/notifications/*', authMiddleware());
api.use('/bots/*', authMiddleware());
// api.use('/sniper/*', authMiddleware());
// api.use('/whale-alert/*', authMiddleware());

api.route('/trade', tradeRoutes);
// api.route('/sniper', sniperRoutes);
// api.route('/whale-alert', whaleAlertRoutes);
api.route('/referral', referralRoutes);
api.route('/notifications', notificationRoutes);
api.route('/bots', botRoutes);

// Webhook 路由 (需要签名验证)
api.route('/webhooks', webhookRoutes);

// 挂载 API 路由
app.route('/api/v1', api);

// ============================================
// WebSocket 端点
// ============================================

app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket', 426);
  }

  // 获取 Durable Object
  const id = c.env.WEBSOCKET_SERVER.idFromName('default');
  const stub = c.env.WEBSOCKET_SERVER.get(id);

  // 转发请求到 Durable Object
  return stub.fetch(c.req.raw);
});

// ============================================
// Sentry 初始化中间件
// ============================================

app.use('*', async (c, next) => {
  // 初始化 Sentry (如果配置了 DSN)
  if (c.env.SENTRY_DSN) {
    Sentry.init({
      dsn: c.env.SENTRY_DSN,
      environment: c.env.ENVIRONMENT,
      tracesSampleRate: c.env.ENVIRONMENT === 'production' ? 0.1 : 1.0,
    });
  }
  await next();
});

// ============================================
// 错误处理
// ============================================

app.onError((err, c) => {
  console.error('API Error:', err);

  // 发送错误到 Sentry
  if (c.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        path: c.req.path,
        method: c.req.method,
      },
      extra: {
        url: c.req.url,
        headers: Object.fromEntries(c.req.raw.headers.entries()),
      },
    });
  }

  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      error: {
        code: `HTTP_${err.status}`,
        message: err.message,
      },
    }, err.status);
  }

  // 生产环境隐藏详细错误信息
  const isDev = c.env.ENVIRONMENT === 'development';

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack }),
    },
  }, 500);
});

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
  }, 404);
});

// ============================================
// Queue 消费者
// ============================================

export default {
  fetch: app.fetch,

  // 处理异步任务队列
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const { type, payload } = message.body;

        switch (type) {
          case 'INDEX_DEV_HISTORY':
            // 索引 Dev 历史数据
            await indexDevHistory(payload, env);
            break;

          case 'UPDATE_TOKEN_STATS':
            // 更新代币统计
            await updateTokenStats(payload, env);
            break;

          case 'SEND_NOTIFICATION':
            // 发送通知
            await sendNotification(payload, env);
            break;

          case 'CHECK_RUG_STATUS':
            // 检查 Rug 状态
            await checkRugStatus(payload, env);
            break;

          // 项目已简化为仅支持 Solana/pump.fun，已移除 sniper 和 whale-alert 功能
          // case 'START_SNIPER':
          //   await startSniperMonitor(payload, env);
          //   break;
          // case 'STOP_SNIPER':
          //   await stopSniperMonitor(payload, env);
          //   break;
          // case 'START_WHALE_MONITOR':
          //   await startWhaleMonitor(payload, env);
          //   break;
          // case 'STOP_WHALE_MONITOR':
          //   await stopWhaleMonitor(payload, env);
          //   break;

          // 项目已简化为仅支持 Solana/pump.fun，已移除 sniper 和 whale-alert 功能
          // case 'SEND_WHALE_ALERT':
          //   await sendWhaleAlert(payload, env);
          //   break;
          // case 'SEND_SNIPER_NOTIFICATION':
          //   await sendSniperNotification(payload, env);
          //   break;

          default:
            console.warn(`Unknown task type: ${type}`);
        }

        message.ack();
      } catch (error) {
        console.error('Task processing error:', error);
        message.retry();
      }
    }
  },

  // 定时任务 (Cron Triggers)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    switch (event.cron) {
      case '*/5 * * * *':
        // 每5分钟: 更新热门代币列表
        ctx.waitUntil(updateTrendingTokens(env));
        break;

      case '0 * * * *':
        // 每小时: 更新 Dev 评分
        ctx.waitUntil(updateDevScores(env));
        break;

      case '0 0 * * *':
        // 每天: 清理过期数据
        ctx.waitUntil(cleanupExpiredData(env));
        break;
    }
  },
};

// ============================================
// WebSocket Durable Object
// ============================================

export class WebSocketServer {
  private sessions: Map<WebSocket, { channels: Set<string>; userId?: string }>;
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleSession(ws: WebSocket) {
    ws.accept();
    this.sessions.set(ws, { channels: new Set() });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleMessage(ws, data);
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
    });
  }

  private handleMessage(ws: WebSocket, data: any) {
    const session = this.sessions.get(ws);
    if (!session) return;

    switch (data.type) {
      case 'subscribe':
        data.channels?.forEach((ch: string) => session.channels.add(ch));
        ws.send(JSON.stringify({ type: 'subscribed', channels: Array.from(session.channels) }));
        break;

      case 'unsubscribe':
        data.channels?.forEach((ch: string) => session.channels.delete(ch));
        ws.send(JSON.stringify({ type: 'unsubscribed', channels: Array.from(session.channels) }));
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }

  broadcast(channel: string, message: any) {
    const payload = JSON.stringify(message);
    for (const [ws, session] of this.sessions) {
      if (session.channels.has(channel)) {
        ws.send(payload);
      }
    }
  }

  // 广播价格更新
  broadcastPriceUpdate(token: string, chain: string, price: number, change24h: number) {
    this.broadcast('price_update', {
      type: 'price_update',
      data: {
        token,
        chain,
        price,
        change24h,
        timestamp: Date.now(),
      },
    });
  }

  // 广播交易更新
  broadcastTransactionUpdate(txHash: string, status: string, data: any) {
    this.broadcast('transaction_update', {
      type: 'transaction_update',
      data: {
        txHash,
        status,
        ...data,
        timestamp: Date.now(),
      },
    });
  }

  // 广播鲸鱼警报
  broadcastWhaleAlert(alert: any) {
    this.broadcast('whale_alert', {
      type: 'whale_alert',
      data: {
        ...alert,
        timestamp: Date.now(),
      },
    });
  }

  // 广播通知
  broadcastNotification(userId: string, notification: any) {
    // 只发送给特定用户
    for (const [ws, session] of this.sessions) {
      if (session.userId === userId && session.channels.has('notifications')) {
        ws.send(JSON.stringify({
          type: 'notification',
          data: {
            ...notification,
            timestamp: Date.now(),
          },
        }));
      }
    }
  }
}

// ============================================
// 服务函数导入
// ============================================

import {
  indexDevHistory,
  updateTokenStats,
  checkRugStatus,
  updateTrendingTokens,
  updateDevScores,
  cleanupExpiredData,
} from './services/blockchain';

import { sendNotification } from './services/notifications';
// 项目已简化为仅支持 Solana/pump.fun，已移除 sniper 和 whale-alert 功能
// import { startSniperMonitor, stopSniperMonitor, sendSniperNotification } from './services/sniper-tasks';
// import { startWhaleMonitor, stopWhaleMonitor, sendWhaleAlert } from './services/whale-tasks';