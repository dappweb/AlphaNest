'use client';

import { Shield, TrendingUp, Users, Zap, Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatUSD } from '@/lib/utils';

const stats = [
  {
    label: 'Total Coverage',
    value: 12500000,
    icon: Shield,
    format: 'usd',
  },
  {
    label: 'Active Policies',
    value: 3456,
    icon: Users,
    format: 'number',
  },
  {
    label: 'Claims Paid',
    value: 2340000,
    icon: TrendingUp,
    format: 'usd',
  },
];

export function InsuranceHero() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-6 md:p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge className="bg-purple-400/30 text-white border-0 text-xs">
              <Rocket className="h-3 w-3 mr-1" />
              pump.fun (SOL)
            </Badge>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            🛡️ Meme Token Insurance
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl">
            Protect your pump.fun meme token investments from rug pulls, 
            price crashes, and smart contract exploits.
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xl md:text-2xl font-bold">🟣 SOL</p>
              <p className="text-white/70 text-xs">pump.fun Tokens</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold">100%</p>
              <p className="text-white/70 text-xs">Max Coverage</p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold">24h</p>
              <p className="text-white/70 text-xs">Claim Process</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4 md:p-6">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold">
                  {stat.format === 'usd'
                    ? formatUSD(stat.value)
                    : stat.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
