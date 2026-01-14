'use client';

import dynamic from 'next/dynamic';

// 延迟加载 K 线图组件（较大的库）
const TokenChart = dynamic(
  () => import('./token-chart').then(mod => ({ default: mod.TokenChart })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] rounded-lg border border-border/50 bg-card/50 animate-pulse flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    )
  }
);

interface LazyTokenChartProps {
  tokenAddress?: string;
  tokenSymbol?: string;
  chain?: string;
}

export function LazyTokenChart(props: LazyTokenChartProps) {
  return <TokenChart {...props} />;
}
