'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Wallet,
  Settings
} from 'lucide-react';

interface CopyTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trader: {
    address: string;
    alias?: string;
    score: number;
    tier: string;
    verified: boolean;
    winRate: number;
  };
  onConfirm: (settings: CopyTradeSettings) => Promise<void>;
}

interface CopyTradeSettings {
  maxPosition: number;
  copyPercent: number;
  stopLoss: number;
  takeProfit: number;
  autoTrade: boolean;
  notifications: boolean;
}

export function CopyTradeModal({ 
  isOpen, 
  onClose, 
  trader, 
  onConfirm 
}: CopyTradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<CopyTradeSettings>({
    maxPosition: 100,
    copyPercent: 10,
    stopLoss: 20,
    takeProfit: 50,
    autoTrade: false,
    notifications: true,
  });

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(settings);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Copy Trade Settings
          </DialogTitle>
          <DialogDescription>
            Configure how you want to copy trades from this trader
          </DialogDescription>
        </DialogHeader>

        {/* Trader Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {trader.tier === 'diamond' ? '💎' : 
                 trader.tier === 'gold' ? '🥇' : '⚪'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {trader.alias || formatAddress(trader.address)}
                  </span>
                  {trader.verified && (
                    <Badge variant="destructive" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Score: {trader.score} • Win Rate: {trader.winRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Max Position */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Max Position Size
              </Label>
              <span className="text-sm font-medium">${settings.maxPosition}</span>
            </div>
            <Input
              type="number"
              value={settings.maxPosition}
              onChange={(e) => setSettings(s => ({ 
                ...s, 
                maxPosition: Number(e.target.value) 
              }))}
              min={10}
              max={10000}
            />
            <p className="text-xs text-muted-foreground">
              Maximum amount per copied trade
            </p>
          </div>

          {/* Copy Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Copy Percentage
              </Label>
              <span className="text-sm font-medium">{settings.copyPercent}%</span>
            </div>
            <Slider
              value={[settings.copyPercent]}
              onValueChange={([val]) => setSettings(s => ({ ...s, copyPercent: val }))}
              min={1}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of trader&apos;s position to copy
            </p>
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stop Loss %</Label>
              <Input
                type="number"
                value={settings.stopLoss}
                onChange={(e) => setSettings(s => ({ 
                  ...s, 
                  stopLoss: Number(e.target.value) 
                }))}
                min={5}
                max={50}
              />
            </div>
            <div className="space-y-2">
              <Label>Take Profit %</Label>
              <Input
                type="number"
                value={settings.takeProfit}
                onChange={(e) => setSettings(s => ({ 
                  ...s, 
                  takeProfit: Number(e.target.value) 
                }))}
                min={10}
                max={500}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Trade</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically execute copied trades
                </p>
              </div>
              <Switch
                checked={settings.autoTrade}
                onCheckedChange={(checked) => 
                  setSettings(s => ({ ...s, autoTrade: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive alerts for new trades
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => 
                  setSettings(s => ({ ...s, notifications: checked }))
                }
              />
            </div>
          </div>

          {/* Warning */}
          {settings.autoTrade && (
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-yellow-500">Auto-trade enabled</span>
                <p className="text-muted-foreground mt-1">
                  Trades will be executed automatically. Make sure you understand the risks involved.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Start Copying'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
