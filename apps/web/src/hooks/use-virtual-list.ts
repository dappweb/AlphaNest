/**
 * 虚拟列表和性能优化 Hooks
 * 用于优化大列表渲染和提升页面响应性
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * 虚拟滚动 Hook - 大列表优化
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    overscan?: number;
    containerHeight?: number;
  }
) {
  const { itemHeight, overscan = 5, containerHeight = 400 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { virtualItems, totalHeight, startIndex, endIndex } = useMemo(() => {
    const height = containerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

    const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));

    return {
      virtualItems,
      totalHeight: items.length * itemHeight,
      startIndex,
      endIndex,
    };
  }, [items, scrollTop, itemHeight, overscan, containerHeight]);

  return {
    containerRef,
    handleScroll,
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    containerStyle: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative' as const,
    },
    innerStyle: {
      height: totalHeight,
      position: 'relative' as const,
    },
  };
}

/**
 * 交叉观察器 Hook - 懒加载优化
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px', ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting, hasIntersected };
}

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流 Hook
 */
export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - (now - lastUpdated.current));
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * 分页 Hook
 */
export function usePagination<T>(
  items: T[],
  options: { pageSize?: number; initialPage?: number } = {}
) {
  const { pageSize = 10, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(items.length / pageSize);
  
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
  };
}

/**
 * 无限滚动 Hook
 */
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  options?: {
    threshold?: number;
    initialLoading?: boolean;
  }
) {
  const { threshold = 0.8, initialLoading = false } = options || {};
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newItems = await fetchMore();
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchMore, isLoading, hasMore]);

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, threshold]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    observerRef,
    loadMore,
    reset: () => {
      setItems([]);
      setHasMore(true);
      setError(null);
    },
  };
}

/**
 * 渲染性能监控 Hook
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[${componentName}] Render #${renderCount.current}, ` +
        `Time since last: ${timeSinceLastRender.toFixed(2)}ms`
      );
    }
    
    lastRenderTime.current = now;
  });

  return { renderCount: renderCount.current };
}

/**
 * 帧率监控 Hook
 */
export function useFPS() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;
    
    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return fps;
}
