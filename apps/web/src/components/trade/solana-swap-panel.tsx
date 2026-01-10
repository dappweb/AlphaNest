'use client';

import { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useJupiterSwap, useSolanaTokens } from '@/hooks/use-jupiter-swap';

export function SolanaSwapPanel() {
  const { connected } = useWallet();
  const { tokens } = useSolanaTokens();
  
  const [inputMint, setInputMint] = useState(tokens[0]?.address || '');
  const [outputMint, setOutputMint] = useState(tokens[1]?.address || '');
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  const {
    quote,
    isLoadingQuote,
    isSwapping,
    error,
    txSignature,
    fetchQuote,
    executeSwap,
    formatOutputAmount,
    getPriceImpact,
  } = useJupiterSwap();

  // Auto-fetch quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputMint && outputMint && inputAmount && parseFloat(inputAmount) > 0) {
        fetchQuote({
          inputMint,
          outputMint,
          amount: inputAmount,
          slippageBps: Math.floor(slippage * 100),
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputMint, outputMint, inputAmount, slippage, fetchQuote]);

  const swapTokens = () => {
    const temp = inputMint;
    setInputMint(outputMint);
    setOutputMint(temp);
    setInputAmount('');
  };

  const inputToken = tokens.find((t) => t.address === inputMint);
  const outputToken = tokens.find((t) => t.address === outputMint);
  const priceImpact = getPriceImpact();
  const isHighImpact = priceImpact !== null && priceImpact > 3;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Solana Swap</CardTitle>
          <Badge variant="outline" className="text-xs">
            Jupiter
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings */}
        {showSettings && (
          <div className="rounded-lg border bg-secondary/50 p-3">
            <label className="text-sm font-medium">Slippage Tolerance</label>
            <div className="mt-2 flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSlippage(value)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Token */}
        <div className="rounded-lg border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">You Pay</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-medium outline-none"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
            />
            <select
              className="rounded-lg border bg-background px-3 py-2 font-medium"
              value={inputMint}
              onChange={(e) => setInputMint(e.target.value)}
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={swapTokens}>
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Output Token */}
        <div className="rounded-lg border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">You Receive</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-medium">
              {isLoadingQuote ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : quote ? (
                formatOutputAmount(quote.outAmount, outputMint)
              ) : (
                <span className="text-muted-foreground">0.0</span>
              )}
            </div>
            <select
              className="rounded-lg border bg-background px-3 py-2 font-medium"
              value={outputMint}
              onChange={(e) => setOutputMint(e.target.value)}
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            {priceImpact !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={isHighImpact ? 'text-destructive' : ''}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span>
                {quote.routePlan?.length || 1} hop(s)
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Success */}
        {txSignature && (
          <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
            <div className="flex items-center justify-between">
              <span>Swap successful!</span>
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!connected ? (
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        ) : !quote ? (
          <Button className="w-full" size="lg" disabled>
            Enter Amount
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={executeSwap}
            disabled={isSwapping || isHighImpact}
            variant={isHighImpact ? 'destructive' : 'default'}
          >
            {isSwapping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Swapping...
              </>
            ) : isHighImpact ? (
              'Price Impact Too High'
            ) : (
              `Swap ${inputToken?.symbol} for ${outputToken?.symbol}`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
