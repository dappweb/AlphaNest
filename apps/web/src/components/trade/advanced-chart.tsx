'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { TokenChart } from './token-chart';

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
const indicators = ['MA', 'EMA', 'RSI', 'MACD', 'Bollinger'] as const;

interface AdvancedChartProps {
  tokenAddress?: string;
  tokenSymbol?: string;
  chain?: string;
}

export function AdvancedChart({ 
  tokenAddress,
  tokenSymbol = 'PEPE',
  chain = 'base'
}: AdvancedChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['MA']);
  const [showSettings, setShowSettings] = useState(false);

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            {tokenSymbol}/USD
            <Badge variant="outline" className="text-xs">Advanced</Badge>
          </CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-9 w-9 border-border/50"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <div className="rounded-lg border bg-secondary/50 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Technical Indicators</h4>
              <div className="flex flex-wrap gap-2">
                {indicators.map((indicator) => (
                  <Button
                    key={indicator}
                    variant={selectedIndicators.includes(indicator) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleIndicator(indicator)}
                    className="h-8 text-xs"
                  >
                    {indicator}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Timeframe</h4>
              <div className="flex gap-2">
                {timeframes.map((tf) => (
                  <Button
                    key={tf}
                    variant={selectedTimeframe === tf ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(tf)}
                    className="h-8 text-xs px-3"
                  >
                    {tf}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <TokenChart 
          tokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          chain={chain}
        />

        {/* Indicator Info */}
        {selectedIndicators.length > 0 && (
          <div className="rounded-lg border bg-secondary/50 p-4 space-y-2">
            <h4 className="text-sm font-medium">Active Indicators</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {selectedIndicators.includes('MA') && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-500" />
                  <span>MA(20): $0.00001234</span>
                </div>
              )}
              {selectedIndicators.includes('EMA') && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-purple-500" />
                  <span>EMA(12): $0.00001256</span>
                </div>
              )}
              {selectedIndicators.includes('RSI') && (
                <div className="flex items-center gap-2">
                  <Badge variant={65 > 70 ? 'destructive' : 65 < 30 ? 'default' : 'secondary'} className="text-xs">
                    RSI(14): 65
                  </Badge>
                </div>
              )}
              {selectedIndicators.includes('MACD') && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-yellow-500" />
                  <span>MACD: Bullish</span>
                </div>
              )}
              {selectedIndicators.includes('Bollinger') && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500" />
                  <span>BB: Upper Band</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
