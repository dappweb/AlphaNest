'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

export function TokenChart({ 
  tokenAddress = '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // Default: PEPE on Base
  tokenSymbol = 'PEPE',
  chain = 'base'
}: TokenChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<string>('0');

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const loadData = useCallback(async () => {
    if (!tokenAddress) {
      setError('Please select a token to view chart');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        chain: chain,
        interval: selectedTimeframe,
        limit: '150',
      });

      const response = await fetch(
        `${API_URL}/api/v1/tokens/${tokenAddress}/chart?${params}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data?.candles || result.data.candles.length === 0) {
        throw new Error('No chart data available');
      }

      const candles: CandleData[] = result.data.candles.map((c: any) => ({
        time: Math.floor(c.time), // 确保是整数时间戳（秒）
        open: parseFloat(c.open) || 0,
        high: parseFloat(c.high) || 0,
        low: parseFloat(c.low) || 0,
        close: parseFloat(c.close) || 0,
      }));

      setChartData(candles);

      if (candles.length > 0) {
        const last = candles[candles.length - 1];
        const first = candles[0];
        setCurrentPrice(last.close.toFixed(10).replace(/\.?0+$/, ''));
        setPriceChange(((last.close - first.open) / first.open) * 100);
      }
    } catch (err) {
      console.error('Error loading chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, chain, selectedTimeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isLoading || chartData.length === 0 || !chartContainerRef.current) {
      // 清理之前的图表实例
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      return;
    }

    let chartInstance: any = null;

    const init = async () => {
      const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');
      if (!chartContainerRef.current) return;

      const container = chartContainerRef.current;

      chartInstance = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#09090b' },
          textColor: '#a1a1aa',
        },
        grid: {
          vertLines: { color: '#18181b' },
          horzLines: { color: '#18181b' },
        },
        width: container.clientWidth,
        height: 400,
        timeScale: {
          borderColor: '#27272a',
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: '#27272a',
          autoScale: true,
        },
        crosshair: {
          vertLine: { color: '#3f3f46', labelBackgroundColor: '#3f3f46' },
          horzLine: { color: '#3f3f46', labelBackgroundColor: '#3f3f46' },
        },
      });

      // lightweight-charts v5 使用 addSeries(CandlestickSeries) 代替 addCandlestickSeries()
      const candlestickSeries = chartInstance.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.00000001,
        },
      });

      candlestickSeries.setData(chartData);
      chartInstance.timeScale().fitContent();

      chartRef.current = chartInstance;
      seriesRef.current = candlestickSeries;

      // 使用 ResizeObserver 完美解决尺寸变化问题
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartInstance) return;
        const { width } = entries[0].contentRect;
        chartInstance.applyOptions({ width });
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    };

    init();

    return () => {
      if (chartInstance) {
        chartInstance.remove();
      }
    };
  }, [isLoading, chartData]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            {tokenSymbol}/USD
            {priceChange !== 0 && (
              <span className={`text-base font-medium flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(priceChange).toFixed(2)}%
              </span>
            )}
          </CardTitle>
          <p className="text-3xl font-bold tracking-tight text-foreground">${currentPrice}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            disabled={isLoading}
            className="h-9 w-9 border-border/50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                disabled={isLoading}
                className="h-7 text-xs px-3"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[400px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] z-10 rounded-xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
        {!error && !isLoading && chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-muted-foreground">No chart data available</p>
          </div>
        )}
        <div
          ref={chartContainerRef}
          className="w-full rounded-lg overflow-hidden"
          style={{ height: '400px' }}
        />
      </CardContent>
    </Card>
  );
}
