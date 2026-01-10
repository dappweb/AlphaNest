'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
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

export function TokenChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  const mockData = useMemo(() => generateMockData(100), [selectedTimeframe]);

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

      candlestickSeries.setData(mockData);
      chart.timeScale().fitContent();

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
  }, [isClient, mockData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">PEPE/USD</CardTitle>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}
