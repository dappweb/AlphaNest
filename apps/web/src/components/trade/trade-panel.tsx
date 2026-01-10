'use client';

import { useState } from 'react';
import { ArrowDownUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TradePanel() {
  const [isBuying, setIsBuying] = useState(true);
  const [amount, setAmount] = useState('');

  const presetAmounts = ['0.1', '0.5', '1', '5'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Swap</span>
          <Badge variant="outline">Base</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex rounded-lg border p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              isBuying
                ? 'bg-success text-success-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setIsBuying(true)}
          >
            Buy
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              !isBuying
                ? 'bg-destructive text-destructive-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setIsBuying(false)}
          >
            Sell
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">You Pay</label>
          <div className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-3">
            <input
              type="number"
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button variant="secondary" size="sm">
              ETH
            </Button>
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
                {preset}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">You Receive</label>
          <div className="flex items-center gap-2 rounded-lg border bg-secondary/50 p-3">
            <input
              type="text"
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl outline-none"
              readOnly
              value={amount ? (parseFloat(amount) * 81234567).toLocaleString() : ''}
            />
            <Button variant="secondary" size="sm">
              PEPE
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Rate</span>
            <span>1 ETH = 81,234,567 PEPE</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Price Impact</span>
            <span className="text-success">{'<0.01%'}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Network Fee</span>
            <span>~$0.12</span>
          </div>
        </div>

        <Button className="w-full" size="lg">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet to Trade
        </Button>
      </CardContent>
    </Card>
  );
}
