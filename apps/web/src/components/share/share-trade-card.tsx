'use client';

import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from './share-button';

interface ShareTradeCardProps {
  type: 'buy' | 'sell';
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  price: number;
  chain: string;
  pnl?: number;
  pnlPercent?: number;
}

export function ShareTradeCard({
  type,
  tokenSymbol,
  tokenName,
  amount,
  price,
  chain,
  pnl,
  pnlPercent,
}: ShareTradeCardProps) {
  const isBuy = type === 'buy';
  const hasPnl = pnl !== undefined && pnlPercent !== undefined;
  const isProfit = hasPnl && pnl >= 0;

  const shareText = hasPnl
    ? `${isProfit ? '🚀' : '📉'} Just ${isBuy ? 'bought' : 'sold'} $${tokenSymbol} on @popcowxyz!\n\n${isProfit ? '✅' : '❌'} ${isProfit ? '+' : ''}${pnlPercent?.toFixed(2)}% PnL\n\n💰 ${amount.toLocaleString()} ${tokenSymbol} @ $${price.toFixed(6)}\n⛓️ ${chain}\n\nJoin the #1 cross-chain Meme platform! 🦊`
    : `${isBuy ? '🟢' : '🔴'} Just ${isBuy ? 'bought' : 'sold'} $${tokenSymbol} on @popcowxyz!\n\n💰 ${amount.toLocaleString()} ${tokenSymbol} @ $${price.toFixed(6)}\n⛓️ ${chain}\n\nJoin the #1 cross-chain Meme platform! 🦊`;

  return (
    <Card className="overflow-hidden">
      <div className={`p-4 ${isBuy ? 'bg-success/10' : 'bg-destructive/10'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={isBuy ? 'default' : 'destructive'}>
              {isBuy ? 'BUY' : 'SELL'}
            </Badge>
            <span className="text-sm text-muted-foreground">{chain}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-bold">PopCow</span>
            <span>🦊</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold">{tokenSymbol.slice(0, 2)}</span>
          </div>
          <div>
            <p className="font-bold text-lg">{tokenSymbol}</p>
            <p className="text-sm text-muted-foreground">{tokenName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-mono font-bold">{amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-mono font-bold">${price.toFixed(6)}</p>
          </div>
        </div>

        {hasPnl && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PnL</span>
              <div className={`flex items-center gap-2 ${isProfit ? 'text-success' : 'text-destructive'}`}>
                {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-bold">
                  {isProfit ? '+' : ''}{pnlPercent?.toFixed(2)}%
                </span>
                <span className="text-sm">
                  ({isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <ShareButton 
          text={shareText}
          title={`${isBuy ? 'Bought' : 'Sold'} ${tokenSymbol}`}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
