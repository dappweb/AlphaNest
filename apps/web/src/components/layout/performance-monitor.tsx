'use client';

import { useEffect } from 'react';
import { usePerformance } from '@/hooks/use-performance';

/**
 * 性能监控组件
 * 在开发环境中监控性能指标
 */
export function PerformanceMonitor() {
  usePerformance();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // 监控 Web Vitals
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      // 动态导入 web-vitals（如果可用）
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(console.log);
        onFID(console.log);
        onFCP(console.log);
        onLCP(console.log);
        onTTFB(console.log);
      }).catch(() => {
        // web-vitals 不可用，忽略
      });
    }
  }, []);

  return null;
}
