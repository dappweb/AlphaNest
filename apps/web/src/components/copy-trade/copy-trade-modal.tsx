'use client';

import { useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatAddress } from '@/lib/utils';
import { Trader } from './copy-trade-card';

interface CopyTradeModalProps {
  trader: Trader | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: CopyTradeSettings) => void;
}

export interface CopyTradeSettings {
  traderAddress: string;
  investmentAmount: number;
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  copyRatio: number;
  enableNotifications: boolean;
}

export function CopyTradeModal({ trader, isOpen, onClose, onConfirm }: CopyTradeModalProps) {
  const [settings, setSettings] = useState<CopyTradeSettings>({
    traderAddress: trader?.address || '',
    investmentAmount: 1000,
    maxPositionSize: 500,
    stopLossPercent: 15,
    takeProfitPercent: 50,
    copyRatio: 100,
    enableNotifications: true,
  });

  const [step, setStep] = useState<'configure' | 'confirm'>('configure');

  if (!isOpen || !trader) return null;

  const handleConfirm = () => {
    if (step === 'configure') {
      setStep('confirm');
    } else {
      onConfirm({ ...settings, traderAddress: trader.address });
      setStep('configure');
      onClose();
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('configure');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-auto border-border/50 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {step === 'configure' ? 'Copy Trade Settings' : 'Confirm Copy Trade'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Trader Info */}
          <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
                {trader.alias?.charAt(0) || trader.address.charAt(2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {trader.alias || formatAddress(trader.address)}
                </span>
                {trader.verified && <CheckCircle className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-success">+{trader.pnlPercent.toFixed(1)}%</span>
                <span>•</span>
                <span>{trader.winRate}% Win</span>
                <span>•</span>
                <span>{trader.followers} followers</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'configure' ? (
            <>
              {/* Investment Amount */}
              <div className="space-y-2">
                <Label htmlFor="investment">Investment Amount (USDC)</Label>
                <Input
                  id="investment"
                  type="number"
                  value={settings.investmentAmount}
                  onChange={(e) => setSettings({ ...settings, investmentAmount: Number(e.target.value) })}
                  min={100}
                  step={100}
                />
                <p className="text-xs text-muted-foreground">
                  Total amount to allocate for copy trading
                </p>
              </div>

              {/* Copy Ratio */}
              <div className="space-y-2">
                <Label htmlFor="ratio">Copy Ratio (%)</Label>
                <Input
                  id="ratio"
                  type="number"
                  value={settings.copyRatio}
                  onChange={(e) => setSettings({ ...settings, copyRatio: Number(e.target.value) })}
                  min={10}
                  max={200}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  100% = same position size as trader
                </p>
              </div>

              {/* Max Position Size */}
              <div className="space-y-2">
                <Label htmlFor="maxPosition">Max Position Size (USDC)</Label>
                <Input
                  id="maxPosition"
                  type="number"
                  value={settings.maxPositionSize}
                  onChange={(e) => setSettings({ ...settings, maxPositionSize: Number(e.target.value) })}
                  min={50}
                  step={50}
                />
              </div>

              {/* Risk Management */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={settings.stopLossPercent}
                    onChange={(e) => setSettings({ ...settings, stopLossPercent: Number(e.target.value) })}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    value={settings.takeProfitPercent}
                    onChange={(e) => setSettings({ ...settings, takeProfitPercent: Number(e.target.value) })}
                    min={10}
                    max={200}
                    step={10}
                  />
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Risk Warning</p>
                  <p className="text-muted-foreground mt-1">
                    Copy trading involves risk. Past performance does not guarantee future results.
                    Only invest what you can afford to lose.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment Amount</span>
                  <span className="font-medium">${settings.investmentAmount.toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Copy Ratio</span>
                  <span className="font-medium">{settings.copyRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Position</span>
                  <span className="font-medium">${settings.maxPositionSize.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stop Loss</span>
                  <span className="font-medium text-destructive">-{settings.stopLossPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Take Profit</span>
                  <span className="font-medium text-success">+{settings.takeProfitPercent}%</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  By confirming, you authorize automatic trade execution based on {trader.alias || formatAddress(trader.address)}&apos;s trading activity.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleBack}
            >
              {step === 'configure' ? 'Cancel' : 'Back'}
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-primary to-emerald-500"
              onClick={handleConfirm}
            >
              {step === 'configure' ? 'Continue' : 'Confirm & Start'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


