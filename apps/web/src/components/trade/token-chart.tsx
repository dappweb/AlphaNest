'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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

function generateMockData(count: number): CandleData[] {
  const data: CandleData[] = [];
  let basePrice = 0.00001234;
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = count; i >= 0; i--) {
    const time = now - i * 900;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = basePrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    data.push({ time, open, high, low, close });
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

export function TokenChart({ tokenAddress, tokenSymbol = 'PEPE', chain = 'base' }: TokenChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
  const [chartData, setChartData] = useState<CandleData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Fetch chart data when token or timeframe changes
  useEffect(() => {
    if (!tokenAddress) {
      // Use mock data if no token address
      setChartData(generateMockData(100));
      return;
    }

    setIsLoading(true);
    fetchChartData(tokenAddress, chain, selectedTimeframe)
      .then((data) => {
        if (data && data.length > 0) {
          setChartData(data);
        } else {
          // Fallback to mock data if API returns no data
          setChartData(generateMockData(100));
        }
      })
      .catch(() => {
        // Fallback to mock data on error
        setChartData(generateMockData(100));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [tokenAddress, chain, selectedTimeframe]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !chartContainerRef.current) return;

    const initChart = async () => {
      const { createChart, ColorType } = await import('lightweight-charts');
      
      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        width: chartContainerRef.current!.clientWidth,
        height: 400,
        timeScale: {
          borderColor: '#374151',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#374151',
        },
        crosshair: {
          vertLine: { color: '#6366f1', width: 1, style: 2 },
          horzLine: { color: '#6366f1', width: 1, style: 2 },
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

      if (chartData && chartData.length > 0) {
        candlestickSeries.setData(chartData);
        chart.timeScale().fitContent();
      }

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;
    };

    initChart();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isClient, chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          {tokenSymbol ? `${tokenSymbol}/USD` : 'Select Token'}
        </CardTitle>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
              disabled={isLoading}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && (
          <div ref={chartContainerRef} className="h-[400px] w-full" />
        )}
      </CardContent>
    </Card>
  );
}
