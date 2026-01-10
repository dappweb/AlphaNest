'use client';

import { ExternalLink, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD, formatNumber, formatAddress } from '@/lib/utils';

const tokenData = {
  name: 'Pepe',
  symbol: 'PEPE',
  address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
  chain: 'Base',
  price: 0.00001234,
  marketCap: 5200000000,
  volume24h: 125000000,
  liquidity: 45000000,
  holders: 234567,
  ath: 0.00002456,
  athDate: '2024-03-15',
  devScore: 85,
  devAddress: '0x1234567890abcdef1234567890abcdef12345678',
  devVerified: true,
};

export function TokenInfo() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold">
            {tokenData.symbol.charAt(0)}
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {tokenData.name}
              <span className="text-muted-foreground">${tokenData.symbol}</span>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatAddress(tokenData.address)}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
          {tokenData.chain}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-xl font-bold">${tokenData.price.toFixed(8)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="text-xl font-bold">{formatUSD(tokenData.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">24h Volume</p>
            <p className="text-xl font-bold">{formatUSD(tokenData.volume24h)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Liquidity</p>
            <p className="text-xl font-bold">{formatUSD(tokenData.liquidity)}</p>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="mb-3 text-sm font-medium">Developer Info</p>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                {tokenData.devVerified ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatAddress(tokenData.devAddress)}
                  </span>
                  {tokenData.devVerified && (
                    <Badge variant="default" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Dev Score: {tokenData.devScore}/100
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Holders</p>
            <p className="font-bold">{formatNumber(tokenData.holders)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">ATH</p>
            <p className="font-bold">${tokenData.ath.toFixed(8)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">ATH Date</p>
            <p className="font-bold">{tokenData.athDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
