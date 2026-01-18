'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode, Suspense, useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 加载状态组件
 */
function LoadingFallback({ 
  height = 200,
  message = 'Loading...' 
}: { 
  height?: number | string;
  message?: string;
}) {
  return (
    <div 
      className="flex items-center justify-center bg-card/50 rounded-lg border animate-pulse"
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

/**
 * 创建懒加载组件
 */
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ReactNode;
    loadingHeight?: number | string;
    loadingMessage?: string;
    ssr?: boolean;
  }
) {
  const { ssr = false, loadingHeight, loadingMessage, loading } = options || {};
  
  return dynamic(importFn, {
    ssr,
    loading: () => {
      if (loading) {
        return <>{loading}</>;
      }
      return (
        <LoadingFallback 
          height={loadingHeight} 
          message={loadingMessage} 
        />
      );
    },
  });
}

/**
 * 预加载组件
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  // 在空闲时预加载
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      importFn();
    });
  } else {
    setTimeout(importFn, 100);
  }
}

/**
 * 懒加载的重型组件
 * 注意: 具体使用时在页面级别使用 dynamic() 导入
 */

// 示例: 在页面中使用
// const LazyComponent = dynamic(() => import('@/components/heavy-component'), {
//   loading: () => <LoadingFallback />,
//   ssr: false
// });

/**
 * 条件渲染 - 仅在可见时渲染
 */
export function LazyRender({ 
  children, 
  fallback,
  rootMargin = '100px' 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <LoadingFallback height={100} />)}
    </div>
  );
}

/**
 * 延迟水合 - 优化首屏加载
 */
export function DelayedHydration({ 
  children,
  delay = 0 
}: { 
  children: ReactNode;
  delay?: number;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!hydrated) {
    return <LoadingFallback height={100} message="Initializing..." />;
  }

  return <>{children}</>;
}

/**
 * 错误边界包装
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
