'use client';

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasHeader?: boolean;
  hasImage?: boolean;
}

/**
 * 骨架屏卡片组件 - 优化加载体验
 */
export function SkeletonCard({ 
  className, 
  lines = 3, 
  hasHeader = true,
  hasImage = false 
}: SkeletonCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 animate-pulse",
      className
    )}>
      {hasImage && (
        <div className="h-32 bg-muted rounded-md mb-4" />
      )}
      {hasHeader && (
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-3 bg-muted rounded" 
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 统计卡片骨架屏
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 md:p-4 animate-pulse">
          <div className="h-3 bg-muted rounded w-2/3 mb-2" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * 表格骨架屏
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="border-b last:border-0 p-4 flex gap-4 animate-pulse">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div 
              key={colIdx} 
              className="h-4 bg-muted rounded flex-1"
              style={{ animationDelay: `${(rowIdx * cols + colIdx) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 图表骨架屏
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 animate-pulse", className)}>
      <div className="h-4 bg-muted rounded w-1/4 mb-4" />
      <div className="h-48 bg-muted/50 rounded flex items-end justify-around gap-2 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-muted rounded-t flex-1"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 列表项骨架屏
 */
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-lg border animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
          <div className="h-6 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * 页面级骨架屏
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Stats */}
      <StatsSkeleton />
      
      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard lines={5} />
        </div>
        <div className="space-y-4">
          <SkeletonCard lines={3} hasHeader={false} />
          <SkeletonCard lines={2} hasHeader={false} />
        </div>
      </div>
    </div>
  );
}
