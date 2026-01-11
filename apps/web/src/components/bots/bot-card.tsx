'use client';

import { useState } from 'react';
import { 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Zap,
  Shield,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD } from '@/lib/utils';

export interface Bot {
  id: string;
  name: string;
  type: 'sniper' | 'dca' | 'grid' | 'copy' | 'arbitrage';
  status: 'running' | 'paused' | 'stopped';
  pnl: number;
  pnlPercent: number;
  trades: number;
  winRate: number;
  investment: number;
  currentValue: number;
  chain: string;
  config: {
    targetToken?: string;
    interval?: string;
    gridLevels?: number;
    traderAddress?: string;
  };
}

interface BotCardProps {
  bot: Bot;
  onToggle: (bot: Bot) => void;
  onConfigure: (bot: Bot) => void;
}

const botTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  sniper: { icon: <Target className="h-4 w-4" />, color: 'bg-red-500/10 text-red-400', label: 'Sniper' },
  dca: { icon: <TrendingUp className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-400', label: 'DCA' },
  grid: { icon: <Activity className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-400', label: 'Grid' },
  copy: { icon: <Zap className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-400', label: 'Copy' },
  arbitrage: { icon: <Shield className="h-4 w-4" />, color: 'bg-green-500/10 text-green-400', label: 'Arbitrage' },
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'running':
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
          Running
        </Badge>
      );
    case 'paused':
      return (
        <Badge variant="warning" className="bg-warning/10 text-warning border-warning/30">
          Paused
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Stopped
        </Badge>
      );
  }
}

export function BotCard({ bot, onToggle, onConfigure }: BotCardProps) {
  const typeConfig = botTypeConfig[bot.type];
  const isProfitable = bot.pnl >= 0;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
              {typeConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{bot.name}</span>
                {getStatusBadge(bot.status)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
                <span>•</span>
                <span>{bot.chain}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 ${isProfitable ? 'text-success' : 'text-destructive'}`}>
              {isProfitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-lg font-bold">
                {isProfitable ? '+' : ''}{formatUSD(bot.pnl)}
              </span>
            </div>
            <span className={`text-sm ${isProfitable ? 'text-success/80' : 'text-destructive/80'}`}>
              {isProfitable ? '+' : ''}{bot.pnlPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 py-3 border-y border-border/50 mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Investment</p>
            <p className="text-sm font-medium">{formatUSD(bot.investment)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-sm font-medium">{formatUSD(bot.currentValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-sm font-medium">{bot.trades}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className={`text-sm font-medium ${
              bot.winRate >= 60 ? 'text-success' : bot.winRate >= 50 ? 'text-warning' : 'text-destructive'
            }`}>
              {bot.winRate}%
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={bot.status === 'running' ? 'destructive' : 'default'}
            size="sm"
            className="flex-1"
            onClick={() => onToggle(bot)}
          >
            {bot.status === 'running' ? (
              <>
                <Pause className="h-4 w-4 mr-1.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                Start
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigure(bot)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
