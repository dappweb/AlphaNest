'use client';

import { useState } from 'react';
import { X, Target, TrendingUp, Activity, Zap, Shield, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BotType = 'sniper' | 'dca' | 'grid' | 'copy' | 'arbitrage';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: BotConfig) => void;
}

export interface BotConfig {
  name: string;
  type: BotType;
  chain: string;
  investment: number;
  // Type-specific config
  targetToken?: string;
  interval?: string;
  gridLevels?: number;
  traderAddress?: string;
  minProfit?: number;
}

const botTypes = [
  {
    type: 'sniper' as BotType,
    name: 'Sniper Bot',
    description: 'Auto-buy new token launches',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
  {
    type: 'dca' as BotType,
    name: 'DCA Bot',
    description: 'Dollar cost average into tokens',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  {
    type: 'grid' as BotType,
    name: 'Grid Bot',
    description: 'Trade within price ranges',
    icon: <Activity className="h-6 w-6" />,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  {
    type: 'copy' as BotType,
    name: 'Copy Bot',
    description: 'Mirror whale wallet trades',
    icon: <Zap className="h-6 w-6" />,
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  {
    type: 'arbitrage' as BotType,
    name: 'Arbitrage Bot',
    description: 'Cross-DEX price arbitrage',
    icon: <Shield className="h-6 w-6" />,
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
];

const chains = ['Ethereum', 'Base', 'Solana', 'BNB Chain'];

export function CreateBotModal({ isOpen, onClose, onCreate }: CreateBotModalProps) {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<BotType | null>(null);
  const [config, setConfig] = useState<Partial<BotConfig>>({
    name: '',
    chain: 'Base',
    investment: 1000,
  });

  if (!isOpen) return null;

  const handleCreate = () => {
    if (selectedType && config.name && config.investment) {
      onCreate({
        ...config,
        type: selectedType,
      } as BotConfig);
      onClose();
      // Reset
      setStep('type');
      setSelectedType(null);
      setConfig({ name: '', chain: 'Base', investment: 1000 });
    }
  };

  const selectedBotInfo = botTypes.find(b => b.type === selectedType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <Card className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {step === 'type' ? 'Create New Bot' : `Configure ${selectedBotInfo?.name}`}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'type' ? (
            /* Bot Type Selection */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Choose the type of trading bot you want to create
              </p>
              {botTypes.map((bot) => (
                <button
                  key={bot.type}
                  className={`w-full p-4 rounded-lg border text-left transition-all hover:bg-muted/50 ${
                    selectedType === bot.type ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedType(bot.type)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bot.color}`}>
                      {bot.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{bot.name}</p>
                      <p className="text-sm text-muted-foreground">{bot.description}</p>
                    </div>
                  </div>
                </button>
              ))}

              <Button
                className="w-full mt-4"
                disabled={!selectedType}
                onClick={() => setStep('config')}
              >
                Continue
              </Button>
            </div>
          ) : (
            /* Bot Configuration */
            <div className="space-y-4">
              {/* Bot Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name</Label>
                <Input
                  id="name"
                  placeholder="My Trading Bot"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </div>

              {/* Chain */}
              <div className="space-y-2">
                <Label>Chain</Label>
                <div className="grid grid-cols-4 gap-2">
                  {chains.map((chain) => (
                    <Button
                      key={chain}
                      variant={config.chain === chain ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConfig({ ...config, chain })}
                    >
                      {chain}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Investment */}
              <div className="space-y-2">
                <Label htmlFor="investment">Investment Amount (USDC)</Label>
                <Input
                  id="investment"
                  type="number"
                  value={config.investment}
                  onChange={(e) => setConfig({ ...config, investment: Number(e.target.value) })}
                  min={100}
                />
              </div>

              {/* Type-specific config */}
              {selectedType === 'sniper' && (
                <div className="space-y-2">
                  <Label htmlFor="targetToken">Target Token (optional)</Label>
                  <Input
                    id="targetToken"
                    placeholder="Token address or leave blank for auto"
                    value={config.targetToken || ''}
                    onChange={(e) => setConfig({ ...config, targetToken: e.target.value })}
                  />
                </div>
              )}

              {selectedType === 'dca' && (
                <div className="space-y-2">
                  <Label>Buy Interval</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {['1h', '4h', '1d', '1w'].map((interval) => (
                      <Button
                        key={interval}
                        variant={config.interval === interval ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setConfig({ ...config, interval })}
                      >
                        {interval}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedType === 'grid' && (
                <div className="space-y-2">
                  <Label htmlFor="gridLevels">Grid Levels</Label>
                  <Input
                    id="gridLevels"
                    type="number"
                    value={config.gridLevels || 10}
                    onChange={(e) => setConfig({ ...config, gridLevels: Number(e.target.value) })}
                    min={5}
                    max={50}
                  />
                </div>
              )}

              {selectedType === 'copy' && (
                <div className="space-y-2">
                  <Label htmlFor="traderAddress">Trader Address to Copy</Label>
                  <Input
                    id="traderAddress"
                    placeholder="0x..."
                    value={config.traderAddress || ''}
                    onChange={(e) => setConfig({ ...config, traderAddress: e.target.value })}
                  />
                </div>
              )}

              {selectedType === 'arbitrage' && (
                <div className="space-y-2">
                  <Label htmlFor="minProfit">Min Profit Threshold (%)</Label>
                  <Input
                    id="minProfit"
                    type="number"
                    value={config.minProfit || 0.5}
                    onChange={(e) => setConfig({ ...config, minProfit: Number(e.target.value) })}
                    min={0.1}
                    step={0.1}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('type')}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={!config.name || !config.investment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bot
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
