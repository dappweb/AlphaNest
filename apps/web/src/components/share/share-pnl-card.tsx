'use client';

import { TrendingUp, TrendingDown, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareButton } from './share-button';

interface SharePnlCardProps {
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  period?: '24h' | '7d' | '30d' | 'all';
}

export function SharePnlCard({ totalValue, pnl, pnlPercent, period = '24h' }: SharePnlCardProps) {
  const isPositive = pnl >= 0;
  
  const periodLabels = {
    '24h': '24 Hours',
    '7d': '7 Days',
    '30d': '30 Days',
    'all': 'All Time',
  };

  const shareText = `💰 My ${periodLabels[period]} performance on @AlphaNestApp:\n\n${isPositive ? '📈' : '📉'} ${isPositive ? '+' : ''}${pnlPercent.toFixed(2)}% (${isPositive ? '+' : ''}$${pnl.toFixed(2)})\n\nJoin the #1 cross-chain Meme platform! 🚀`;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold">🦊</span>
            </div>
            <span className="font-bold">AlphaNest</span>
          </div>
          <span className="text-sm text-muted-foreground">{periodLabels[period]}</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Portfolio Value</p>
            <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span className="text-2xl font-bold">
                {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
            </div>
            <span className={`text-lg ${isPositive ? 'text-success' : 'text-destructive'}`}>
              ({isPositive ? '+' : ''}${Math.abs(pnl).toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <ShareButton 
          text={shareText}
          title="My AlphaNest Performance"
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
