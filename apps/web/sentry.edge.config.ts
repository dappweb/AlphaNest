// Sentry Edge Configuration
// Edge Runtime 错误追踪 (Middleware)

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV,

  beforeSend(event: any) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    event.tags = {
      ...event.tags,
      app: 'alphanest-web',
      runtime: 'edge',
    };

    return event;
  },
});
