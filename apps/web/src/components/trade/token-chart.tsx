'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TokenChartProps {
  tokenAddress?: string;
  tokenSymbol?: string;
  chain?: string;
}

// 生成模拟数据
function generateMockData(count: number, interval: string = '15m'): CandleData[] {
  const data: CandleData[] = [];

  const intervalMap: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };
  const intervalSeconds = intervalMap[interval] || 900;

  let basePrice = 0.00001234 + Math.random() * 0.00001;
  const now = Math.floor(Date.now() / 1000);

  let trend = Math.random() > 0.5 ? 1 : -1;
  let trendDuration = Math.floor(Math.random() * 20) + 10;

  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalSeconds;

    if (trendDuration <= 0) {
      trend = Math.random() > 0.5 ? 1 : -1;
      trendDuration = Math.floor(Math.random() * 20) + 10;
    }
    trendDuration--;

    const volatility = 0.03;
    const trendBias = trend * 0.005;
    const change = (Math.random() - 0.5) * volatility + trendBias;

    const open = basePrice;
    const close = Math.max(basePrice * (1 + change), 0.000000001);
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);

    data.push({ time, open, high, low, close });
    basePrice = close;
  }

  return data;
}

export function TokenChart({ tokenSymbol = 'MEME' }: TokenChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1d');
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<string>('0');
  const [chartInitialized, setChartInitialized] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // 生成数据
  const loadData = useCallback(() => {
    setIsLoading(true);

    // 模拟加载延迟
    setTimeout(() => {
      const mockData = generateMockData(100, selectedTimeframe);
      setChartData(mockData);

      if (mockData.length > 0) {
        const lastCandle = mockData[mockData.length - 1];
        const firstCandle = mockData[0];
        setCurrentPrice(lastCandle.close.toFixed(8));
        setPriceChange(((lastCandle.close - firstCandle.open) / firstCandle.open) * 100);
      }

      setIsLoading(false);
    }, 300);
  }, [selectedTimeframe]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 初始化和更新图表
  useEffect(() => {
    if (isLoading || chartData.length === 0 || !chartContainerRef.current) return;

    let isMounted = true;

    const initChart = async () => {
      try {
        const { createChart, ColorType } = await import('lightweight-charts');

        if (!isMounted || !chartContainerRef.current) return;

        // 清除旧图表
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
        }

        const container = chartContainerRef.current;
        const containerWidth = container.clientWidth || 600;

        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
            horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
          },
          width: containerWidth,
          height: 400,
          timeScale: {
            borderColor: '#374151',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#374151',
            scaleMargins: { top: 0.1, bottom: 0.1 },
          },
          crosshair: {
            vertLine: { color: '#6366f1', width: 1, style: 2, labelVisible: true },
            horzLine: { color: '#6366f1', width: 1, style: 2, labelVisible: true },
          },
        });

        const candlestickSeries = (chart as any).addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        });

        candlestickSeries.setData(chartData);
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;
        setChartInitialized(true);

        // 响应式处理
        const handleResize = () => {
          if (container && chartRef.current) {
            chartRef.current.applyOptions({ width: container.clientWidth });
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('Chart init error:', error);
      }
    };

    initChart();

    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [isLoading, chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            {tokenSymbol}/USD
            {priceChange !== 0 && (
              <span className={`text-sm flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            )}
          </CardTitle>
          <p className="text-2xl font-bold text-primary">${currentPrice}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                disabled={isLoading}
                className="text-xs h-8"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <div
          ref={chartContainerRef}
          className="h-[400px] w-full"
          style={{ minHeight: '400px' }}
        />
        {!isLoading && !chartInitialized && chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">No chart data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
