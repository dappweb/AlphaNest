'use client';

import { AlertTriangle, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD, formatAddress } from '@/lib/utils';

const products = [
  {
    id: 1,
    tokenName: 'MOON',
    tokenSymbol: 'MOON',
    chain: 'Base',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    premiumRate: 5,
    poolSize: 250000,
    currentOdds: { rug: 2.5, safe: 1.4 },
    expiresIn: '24h',
    riskLevel: 'medium',
  },
  {
    id: 2,
    tokenName: 'PEPE2',
    tokenSymbol: 'PEPE2',
    chain: 'Solana',
    address: '5SxxVGjpCBK7t1234567890abcdef12345678',
    premiumRate: 8,
    poolSize: 180000,
    currentOdds: { rug: 1.8, safe: 2.1 },
    expiresIn: '12h',
    riskLevel: 'high',
  },
  {
    id: 3,
    tokenName: 'DOGE3',
    tokenSymbol: 'DOGE3',
    chain: 'BNB',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    premiumRate: 3,
    poolSize: 420000,
    currentOdds: { rug: 4.2, safe: 1.2 },
    expiresIn: '48h',
    riskLevel: 'low',
  },
];

function getRiskBadge(level: string) {
  switch (level) {
    case 'high':
      return <Badge variant="destructive">High Risk</Badge>;
    case 'medium':
      return <Badge variant="warning">Medium Risk</Badge>;
    default:
      return <Badge variant="success">Low Risk</Badge>;
  }
}

export function InsuranceProducts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Available Insurance Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
                  {product.tokenSymbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.tokenName}</span>
                    <span className="text-sm text-muted-foreground">
                      ${product.tokenSymbol}
                    </span>
                    <Badge variant="outline">{product.chain}</Badge>
                    {getRiskBadge(product.riskLevel)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(product.address)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Premium Rate</p>
                  <p className="font-bold">{product.premiumRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pool Size</p>
                  <p className="font-bold">{formatUSD(product.poolSize)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Rug Odds
                  </p>
                  <p className="font-bold text-destructive">{product.currentOdds.rug}x</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires
                  </p>
                  <p className="font-bold">{product.expiresIn}</p>
                </div>
                <Button>Buy Coverage</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
