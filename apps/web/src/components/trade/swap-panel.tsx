'use client';

import { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSwap, type TokenInfo } from '@/hooks/use-swap';
import { formatUSD } from '@/lib/utils';

// Common tokens for quick selection
const COMMON_TOKENS: Record<number, TokenInfo[]> = {
  1: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6 },
  ],
  8453: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  ],
  11155111: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { address: '0xceCC6D1dA322b6AC060D3998CA58e077CB679F79', symbol: 'USDC', name: 'Mock USDC', decimals: 6 },
  ],
};

export function SwapPanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [showSettings, setShowSettings] = useState(false);

  const {
    sellToken,
    buyToken,
    sellAmount,
    buyAmount,
    slippage,
    quote,
    quoteSource,
    isLoadingQuote,
    error,
    setSellToken,
    setBuyToken,
    setSellAmount,
    setSlippage,
    swapTokens,
    fetchQuote,
    needsApproval,
    approveToken,
    executeSwap,
    isApproving,
    isSwapping,
    isApproveSuccess,
    isSwapSuccess,
    priceImpact,
    sellTokenBalance,
  } = useSwap(chainId);

  const tokens = COMMON_TOKENS[chainId] || COMMON_TOKENS[1];

  // Auto-fetch quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sellToken && buyToken && sellAmount && parseFloat(sellAmount) > 0) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sellToken, buyToken, sellAmount, fetchQuote]);

  // Set default tokens
  useEffect(() => {
    if (!sellToken && tokens.length > 0) {
      setSellToken(tokens[0]);
    }
    if (!buyToken && tokens.length > 1) {
      setBuyToken(tokens[1]);
    }
  }, [tokens, sellToken, buyToken, setSellToken, setBuyToken]);

  const impact = priceImpact();
  const isHighImpact = impact !== null && impact > 3;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Swap</CardTitle>
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
              <div className="flex items-center gap-1 rounded border px-2">
                <input
                  type="number"
                  className="w-12 bg-transparent text-right text-sm outline-none"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                  step="0.1"
                  min="0.01"
                  max="50"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Sell Token */}
        <div className="rounded-lg border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">You Pay</span>
            {sellToken && (
              <span className="text-xs text-muted-foreground">
                Balance: {parseFloat(sellTokenBalance).toFixed(4)} {sellToken.symbol}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-medium outline-none"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
            />
            <select
              className="rounded-lg border bg-background px-3 py-2 font-medium"
              value={sellToken?.address || ''}
              onChange={(e) => {
                const token = tokens.find((t) => t.address === e.target.value);
                setSellToken(token || null);
              }}
            >
              {tokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-1">
            {['25', '50', '75', '100'].map((pct) => (
              <Button
                key={pct}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const maxAmount = parseFloat(sellTokenBalance);
                  const amount = (maxAmount * parseInt(pct)) / 100;
                  setSellAmount(amount.toString());
                }}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={swapTokens}>
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Buy Token */}
        <div className="rounded-lg border bg-secondary/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">You Receive</span>
            {quoteSource && (
              <Badge variant="outline" className="text-xs">
                via {quoteSource}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-medium">
              {isLoadingQuote ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : buyAmount ? (
                parseFloat(buyAmount).toFixed(6)
              ) : (
                <span className="text-muted-foreground">0.0</span>
              )}
            </div>
            <select
              className="rounded-lg border bg-background px-3 py-2 font-medium"
              value={buyToken?.address || ''}
              onChange={(e) => {
                const token = tokens.find((t) => t.address === e.target.value);
                setBuyToken(token || null);
              }}
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>
                1 {sellToken?.symbol} = {parseFloat(quote.price).toFixed(6)} {buyToken?.symbol}
              </span>
            </div>
            {impact !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={isHighImpact ? 'text-destructive' : ''}>
                  {impact.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Gas</span>
              <span>{formatUSD(parseFloat(quote.estimatedGas) * 0.00001)}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Success Messages */}
        {isApproveSuccess && !isSwapSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            Token approved! You can now swap.
          </div>
        )}

        {isSwapSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            Swap successful!
          </div>
        )}

        {/* Action Buttons */}
        {!isConnected ? (
          <Button className="w-full" size="lg" disabled>
            Connect Wallet
          </Button>
        ) : !quote ? (
          <Button className="w-full" size="lg" disabled>
            Enter Amount
          </Button>
        ) : needsApproval() ? (
          <Button className="w-full" size="lg" onClick={approveToken} disabled={isApproving}>
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              `Approve ${sellToken?.symbol}`
            )}
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
              'Swap'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
