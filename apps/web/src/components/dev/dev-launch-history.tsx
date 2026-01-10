'use client';

import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD, formatAddress } from '@/lib/utils';

interface DevLaunchHistoryProps {
  address: string;
}

const mockLaunches = [
  {
    id: 1,
    name: 'MOON',
    symbol: 'MOON',
    chain: 'Base',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    launchDate: '2024-12-01',
    athMarketCap: 12500000,
    currentMarketCap: 8900000,
    status: 'active',
    multiplier: 125,
  },
  {
    id: 2,
    name: 'STAR',
    symbol: 'STAR',
    chain: 'Solana',
    address: '5SxxVGjpCBK7t1234567890abcdef12345678',
    launchDate: '2024-11-15',
    athMarketCap: 5600000,
    currentMarketCap: 2300000,
    status: 'active',
    multiplier: 56,
  },
  {
    id: 3,
    name: 'ROCKET',
    symbol: 'RCKT',
    chain: 'Base',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    launchDate: '2024-10-20',
    athMarketCap: 890000,
    currentMarketCap: 0,
    status: 'dead',
    multiplier: 8.9,
  },
  {
    id: 4,
    name: 'ALPHA',
    symbol: 'ALPHA',
    chain: 'BNB',
    address: '0x567890abcdef1234567890abcdef1234567890ab',
    launchDate: '2024-09-10',
    athMarketCap: 3400000,
    currentMarketCap: 1200000,
    status: 'graduated',
    multiplier: 34,
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'graduated':
      return <Badge variant="default">Graduated</Badge>;
    case 'dead':
      return <Badge variant="secondary">Dead</Badge>;
    case 'rugged':
      return <Badge variant="destructive">Rugged</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getChainColor(chain: string) {
  switch (chain) {
    case 'Base':
      return 'bg-blue-500/10 text-blue-500';
    case 'Solana':
      return 'bg-purple-500/10 text-purple-500';
    case 'BNB':
      return 'bg-yellow-500/10 text-yellow-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

export function DevLaunchHistory({ address }: DevLaunchHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Launch History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockLaunches.map((launch) => (
            <div
              key={launch.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
                  {launch.symbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{launch.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${launch.symbol}
                    </span>
                    <Badge variant="outline" className={getChainColor(launch.chain)}>
                      {launch.chain}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatAddress(launch.address)}</span>
                    <span>•</span>
                    <span>{launch.launchDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">ATH Market Cap</p>
                  <p className="font-medium">{formatUSD(launch.athMarketCap)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Multiplier</p>
                  <p
                    className={`flex items-center font-medium ${
                      launch.multiplier >= 10 ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {launch.multiplier >= 10 ? (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    )}
                    {launch.multiplier}x
                  </p>
                </div>
                <div className="w-24 text-center">{getStatusBadge(launch.status)}</div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
