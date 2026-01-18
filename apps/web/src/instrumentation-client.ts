// Sentry Client Instrumentation
// 浏览器端错误追踪 (Next.js 15+ 推荐方式)

import * as Sentry from '@sentry/nextjs';

// 仅在有 DSN 时初始化
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 调整采样率 (生产环境建议 0.1-0.2)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 会话回放采样 (可选功能)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // 调试模式 (开发环境)
    debug: false,

    // 环境标识
    environment: process.env.NODE_ENV,

    // 集成配置
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // 忽略特定错误
    ignoreErrors: [
      // 网络相关
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // 钱包相关
      'User rejected the request',
      'User denied transaction signature',
      // 浏览器扩展
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],

    // 发送前处理
    beforeSend(event) {
      // 过滤掉开发环境的错误
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      // 添加额外上下文
      event.tags = {
        ...event.tags,
        app: 'popcowdefi-web',
      };

      return event;
    },
  });
}
