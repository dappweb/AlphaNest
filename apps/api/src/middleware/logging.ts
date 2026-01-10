/**
 * 日志中间件 - 请求/响应日志记录
 */

import { Context, Next } from 'hono';
import { Logger, generateRequestId, Timer, type LogContext } from '../utils/logger';

export function loggingMiddleware() {
  return async (c: Context, next: Next) => {
    const requestId = generateRequestId();
    const timer = new Timer();
    
    // Create request-scoped logger
    const logger = new Logger('alphanest-api', 'production', 'info');
    logger.setContext({ requestId });
    
    // Store logger and requestId in context
    c.set('logger', logger);
    c.set('requestId', requestId);
    
    // Add request ID to response headers
    c.header('X-Request-ID', requestId);
    
    // Log request start
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    logger.info('Request started', {
      method,
      path,
      userAgent,
      ip,
    });

    try {
      await next();
      
      // Log request completion
      const duration = timer.elapsed();
      const statusCode = c.res.status;
      
      logger.logRequest(method, path, statusCode, duration, {
        userAgent,
        ip,
      });
      
    } catch (error) {
      // Log error
      const duration = timer.elapsed();
      
      if (error instanceof Error) {
        logger.logError(error, {
          method,
          path,
          duration,
          ip,
        });
      }
      
      throw error;
    }
  };
}

// Error logging middleware
export function errorLoggingMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      const logger = c.get('logger') as Logger | undefined;
      
      if (error instanceof Error) {
        if (logger) {
          logger.logError(error);
        } else {
          console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: error.message,
            stack: error.stack,
          }));
        }
      }
      
      // Return error response
      const statusCode = (error as any).status || 500;
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
        requestId: c.get('requestId'),
      }, statusCode);
    }
  };
}

// Performance monitoring middleware
export function performanceMiddleware(slowThresholdMs: number = 1000) {
  return async (c: Context, next: Next) => {
    const timer = new Timer();
    
    await next();
    
    const duration = timer.elapsed();
    
    if (duration > slowThresholdMs) {
      const logger = c.get('logger') as Logger | undefined;
      
      if (logger) {
        logger.warn('Slow request detected', {
          method: c.req.method,
          path: c.req.path,
          duration,
          threshold: slowThresholdMs,
        });
      }
    }
    
    // Add timing header
    c.header('X-Response-Time', `${duration}ms`);
  };
}
