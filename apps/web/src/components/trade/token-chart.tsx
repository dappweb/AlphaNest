'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.suiyiwan1.workers.dev';

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

// 生成更真实的模拟数据
function generateMockData(count: number, interval: string = '15m'): CandleData[] {
  const data: CandleData[] = [];

  // 根据时间间隔计算秒数
  const intervalMap: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };
  const intervalSeconds = intervalMap[interval] || 900;

  // 初始价格
  let basePrice = 0.00001234 + Math.random() * 0.00001;
  const now = Math.floor(Date.now() / 1000);

  // 添加一些波动趋势
  let trend = Math.random() > 0.5 ? 1 : -1;
  let trendDuration = Math.floor(Math.random() * 20) + 10;

  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalSeconds;

    // 动态改变趋势
    if (trendDuration <= 0) {
      trend = Math.random() > 0.5 ? 1 : -1;
      trendDuration = Math.floor(Math.random() * 20) + 10;
    }
    trendDuration--;

    // 计算价格变动
    const volatility = 0.03;
    const trendBias = trend * 0.005; // 趋势偏差
    const change = (Math.random() - 0.5) * volatility + trendBias;

    const open = basePrice;
    const close = Math.max(basePrice * (1 + change), 0.000000001);
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);

    data.push({
      time,
      open: Number(open.toFixed(12)),
      high: Number(high.toFixed(12)),
      low: Number(low.toFixed(12)),
      close: Number(close.toFixed(12))
    });
    basePrice = close;
  }

  return data;
}

async function fetchChartData(
  tokenAddress: string,
  chain: string,
  interval: string
): Promise<CandleData[] | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/tokens/${tokenAddress}/chart?chain=${chain}&interval=${interval}&limit=100`
    );
    const result = await response.json();

    if (result.success && result.data?.candles) {
      return result.data.candles.map((candle: any) => ({
        time: candle.time || candle.timestamp || Date.now() / 1000,
        open: parseFloat(candle.open || '0'),
        high: parseFloat(candle.high || '0'),
        low: parseFloat(candle.low || '0'),
        close: parseFloat(candle.close || '0'),
      }));
    }
    return null;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return null;
  }
}

export function TokenChart({ tokenAddress, tokenSymbol = 'MEME', chain = 'solana' }: TokenChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<string>('0');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      if (tokenAddress) {
        const data = await fetchChartData(tokenAddress, chain, selectedTimeframe);
        if (data && data.length > 0) {
          setChartData(data);
          const lastCandle = data[data.length - 1];
          const firstCandle = data[0];
          setCurrentPrice(lastCandle.close.toFixed(8));
          setPriceChange(((lastCandle.close - firstCandle.open) / firstCandle.open) * 100);
          setIsLoading(false);
          return;
        }
      }

      // 使用模拟数据
      const mockData = generateMockData(100, selectedTimeframe);
      setChartData(mockData);
      const lastCandle = mockData[mockData.length - 1];
      const firstCandle = mockData[0];
      setCurrentPrice(lastCandle.close.toFixed(8));
      setPriceChange(((lastCandle.close - firstCandle.open) / firstCandle.open) * 100);
    } catch (error) {
      console.error('Chart data error:', error);
      const mockData = generateMockData(100, selectedTimeframe);
      setChartData(mockData);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, chain, selectedTimeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    const initChart = async () => {
      try {
        const { createChart, ColorType } = await import('lightweight-charts');

        // 清除旧图表
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        const container = chartContainerRef.current;
        if (!container) return;

        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: 'transparent' },
            textColor: '#9ca3af',
          },
          grid: {
            vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
            horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
          },
          width: container.clientWidth,
          height: 400,
          timeScale: {
            borderColor: '#374151',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#374151',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          crosshair: {
            vertLine: { color: '#6366f1', width: 1, style: 2, labelVisible: true },
            horzLine: { color: '#6366f1', width: 1, style: 2, labelVisible: true },
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candlestickSeries = (chart as any).addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        });

        // 设置数据
        candlestickSeries.setData(chartData);
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData]);

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
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
              disabled={isLoading}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div ref={chartContainerRef} className="h-[400px] w-full" />
        )}
      </CardContent>
    </Card>
  );
}
