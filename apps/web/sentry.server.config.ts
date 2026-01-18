// Sentry Server Configuration
// 服务端错误追踪 (SSR / API Routes)

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 服务端采样率
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 调试模式
  debug: process.env.NODE_ENV === 'development',

  // 环境标识
  environment: process.env.NODE_ENV,

  // 忽略特定错误
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],

  // 发送前处理
  beforeSend(event: any) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    event.tags = {
      ...event.tags,
      app: 'alphanest-web',
      runtime: 'server',
    };

    return event;
  },
});
