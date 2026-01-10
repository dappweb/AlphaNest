'use client';

import { useState } from 'react';
import { X, Shield, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatUSD } from '@/lib/utils';
import { usePurchasePolicy, usePoolOdds, useUsdcBalance, Position } from '@/hooks/use-alphaguard';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    tokenName: string;
    tokenSymbol: string;
    chain: string;
    poolSize: number;
    premiumRate: number;
    expiresIn: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export function PurchaseModal({ isOpen, onClose, product }: PurchaseModalProps) {
  const [position, setPosition] = useState<Position>(Position.RUG);
  const [amount, setAmount] = useState('');

  const { balance } = useUsdcBalance();
  const { rugOdds, safeOdds } = usePoolOdds(product.id);
  const { purchasePolicy, isApproving, isPurchasing, isPurchaseSuccess } = usePurchasePolicy();

  const currentOdds = position === Position.RUG ? rugOdds : safeOdds;
  const potentialPayout = amount && currentOdds ? parseFloat(amount) * currentOdds : 0;

  const handlePurchase = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    await purchasePolicy(product.id, position, amount);
  };

  const presetAmounts = ['50', '100', '250', '500'];

  if (!isOpen) return null;

  if (isPurchaseSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <Shield className="h-8 w-8 text-success" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Policy Purchased!</h3>
            <p className="mt-2 text-muted-foreground">
              Your insurance policy for {product.tokenName} has been created successfully.
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Buy Coverage
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Info */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
              {product.tokenSymbol.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{product.tokenName}</p>
              <p className="text-sm text-muted-foreground">
                ${product.tokenSymbol} • {product.chain}
              </p>
            </div>
            <Badge
              variant={
                product.riskLevel === 'high'
                  ? 'destructive'
                  : product.riskLevel === 'medium'
                  ? 'warning'
                  : 'success'
              }
              className="ml-auto"
            >
              {product.riskLevel} risk
            </Badge>
          </div>

          {/* Position Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Position</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                  position === Position.RUG
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setPosition(Position.RUG)}
              >
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">Bet Rug</span>
                {rugOdds && (
                  <Badge variant="outline" className="ml-1">
                    {rugOdds.toFixed(2)}x
                  </Badge>
                )}
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                  position === Position.SAFE
                    ? 'border-success bg-success/10 text-success'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setPosition(Position.SAFE)}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Bet Safe</span>
                {safeOdds && (
                  <Badge variant="outline" className="ml-1">
                    {safeOdds.toFixed(2)}x
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Amount (USDC)</label>
              <span className="text-sm text-muted-foreground">
                Balance: {parseFloat(balance).toFixed(2)} USDC
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-3">
              <input
                type="number"
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="text-muted-foreground">USDC</span>
            </div>
            <div className="flex gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setAmount(preset)}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position</span>
              <span className={position === Position.RUG ? 'text-destructive' : 'text-success'}>
                {position === Position.RUG ? 'Betting Rug' : 'Betting Safe'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Odds</span>
              <span>{currentOdds?.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Payout</span>
              <span className="font-bold text-success">{formatUSD(potentialPayout)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span>{product.expiresIn}</span>
            </div>
          </div>

          {/* Warning */}
          <p className="text-xs text-muted-foreground">
            By purchasing this coverage, you agree that the outcome is determined by the AlphaGuard
            oracle. Payouts are made automatically based on the final determination.
          </p>

          {/* Purchase Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePurchase}
            disabled={!amount || parseFloat(amount) <= 0 || isApproving || isPurchasing}
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving USDC...
              </>
            ) : isPurchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Purchasing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Purchase Coverage
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
