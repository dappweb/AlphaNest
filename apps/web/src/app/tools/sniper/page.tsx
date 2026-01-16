'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Target, Zap, Wallet, Coins } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

export default function SniperBotPage() {
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected } = useWallet();
  const [isActive, setIsActive] = useState(false);
  const [targetToken, setTargetToken] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [slippage, setSlippage] = useState('5');
  const [autoSell, setAutoSell] = useState(false);
  const [takeProfit, setTakeProfit] = useState('50');
  const [stopLoss, setStopLoss] = useState('20');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!targetToken.trim() || !buyAmount.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to start sniper bot
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsActive(true);
    } catch (err) {
      console.error('Error starting sniper:', err);
      alert('Failed to start sniper bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API to stop sniper bot
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsActive(false);
    } catch (err) {
      console.error('Error stopping sniper:', err);
      alert('Failed to stop sniper bot');
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = isEvmConnected || isSolanaConnected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Sniper Bot
        </h1>
        <p className="text-muted-foreground mt-2">
          Advanced paid feature - Automatically buy tokens at launch
        </p>
      </div>

      {!isConnected && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Connect a wallet to use the Sniper Bot
            </p>
            {isSolanaConnected ? null : <WalletMultiButton />}
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Target Token Address</Label>
                <Input
                  id="token"
                  placeholder="Enter token address or Pump.fun URL"
                  value={targetToken}
                  onChange={(e) => setTargetToken(e.target.value)}
                  disabled={isActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Buy Amount (SOL)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.1"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  disabled={isActive}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  placeholder="5"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  disabled={isActive}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/50">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sell">Auto Sell</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically sell when profit target is reached
                  </p>
                </div>
                <Switch
                  id="auto-sell"
                  checked={autoSell}
                  onCheckedChange={setAutoSell}
                  disabled={isActive}
                />
              </div>

              {autoSell && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="profit">Take Profit (%)</Label>
                    <Input
                      id="profit"
                      type="number"
                      placeholder="50"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      disabled={isActive}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loss">Stop Loss (%)</Label>
                    <Input
                      id="loss"
                      type="number"
                      placeholder="20"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      disabled={isActive}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                {!isActive ? (
                  <Button
                    className="flex-1"
                    onClick={handleStart}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Start Sniper
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={handleStop}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      'Stop Sniper'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {isActive && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Target Token</span>
                      <span className="text-sm font-mono">{targetToken.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Buy Amount</span>
                      <span className="text-sm font-medium">{buyAmount} SOL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Slippage</span>
                      <span className="text-sm font-medium">{slippage}%</span>
                    </div>
                    {autoSell && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Take Profit</span>
                          <span className="text-sm font-medium text-green-500">{takeProfit}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Stop Loss</span>
                          <span className="text-sm font-medium text-red-500">{stopLoss}%</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {isActive && (
                <div className="rounded-lg border bg-secondary/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Waiting for launch...</p>
                  <p className="text-xs text-muted-foreground">
                    The bot will automatically execute when the token launches
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  ⚠️ Cost: 100 PopCowDefi per snipe
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is a premium feature that requires PopCowDefi tokens
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>How Sniper Bot Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            The Sniper Bot automatically buys tokens as soon as they launch on Pump.fun or other platforms.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Monitors token launches in real-time</li>
            <li>Executes buy orders instantly when token launches</li>
            <li>Optional auto-sell with take profit and stop loss</li>
            <li>Requires PopCowDefi tokens to use (100 tokens per snipe)</li>
          </ul>
          <p className="pt-2 text-yellow-600 dark:text-yellow-400">
            <strong>Warning:</strong> Sniper bots involve high risk. Only use funds you can afford to lose.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
