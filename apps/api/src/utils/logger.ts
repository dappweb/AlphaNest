/**
 * 日志服务 - 结构化日志记录
 * 
 * 支持:
 * - 多级别日志 (debug, info, warn, error)
 * - 结构化 JSON 输出
 * - 请求追踪
 * - 性能监控
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  service: string;
  environment: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private service: string;
  private environment: string;
  private minLevel: LogLevel;
  private context: LogContext;

  constructor(
    service: string = 'alphanest-api',
    environment: string = 'production',
    minLevel: LogLevel = 'info'
  ) {
    this.service = service;
    this.environment = environment;
    this.minLevel = minLevel;
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      service: this.service,
      environment: this.environment,
    };
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, context);
    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  // Set persistent context
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  // Clear context
  clearContext(): void {
    this.context = {};
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const child = new Logger(this.service, this.environment, this.minLevel);
    child.setContext({ ...this.context, ...context });
    return child;
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Log HTTP request
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.log(level, `${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  // Log error with stack trace
  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      error: error.name,
      stack: error.stack,
      ...context,
    });
  }
}

// Default logger instance
export const logger = new Logger(
  'alphanest-api',
  process.env.ENVIRONMENT || 'production',
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);

// Request ID generator
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// Performance timer
export class Timer {
  private start: number;

  constructor() {
    this.start = performance.now();
  }

  elapsed(): number {
    return Math.round(performance.now() - this.start);
  }
}
