'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Fish, Bell, BellOff, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

interface WhaleAlert {
  id: string;
  wallet: string;
  token: string;
  tokenSymbol: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  amountUsd: number;
  timestamp: number;
  txHash: string;
}

export default function WhaleAlertPage() {
  const { isConnected: isEvmConnected } = useAccount();
  const { connected: isSolanaConnected } = useWallet();
  const [isEnabled, setIsEnabled] = useState(false);
  const [minAmount, setMinAmount] = useState('10000');
  const [trackedTokens, setTrackedTokens] = useState<string[]>([]);
  const [newToken, setNewToken] = useState('');
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = isEvmConnected || isSolanaConnected;

  useEffect(() => {
    if (isEnabled && isConnected) {
      // TODO: Subscribe to whale alerts via WebSocket
      const interval = setInterval(() => {
        // Mock alerts for demo
        setAlerts(prev => [
          {
            id: Date.now().toString(),
            wallet: 'So11111111111111111111111111111111111112',
            token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            tokenSymbol: 'USDC',
            type: 'buy',
            amount: 50000,
            amountUsd: 50000,
            timestamp: Date.now(),
            txHash: 'mock-tx-hash',
          },
          ...prev.slice(0, 9),
        ]);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isEnabled, isConnected]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      // TODO: Call API to enable/disable alerts
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsEnabled(!isEnabled);
    } catch (err) {
      console.error('Error toggling alerts:', err);
      alert('Failed to toggle alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToken = () => {
    if (newToken.trim() && !trackedTokens.includes(newToken.trim())) {
      setTrackedTokens([...trackedTokens, newToken.trim()]);
      setNewToken('');
    }
  };

  const handleRemoveToken = (token: string) => {
    setTrackedTokens(trackedTokens.filter(t => t !== token));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Fish className="h-8 w-8 text-primary" />
          Whale Alert
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor large wallet movements and get real-time alerts
        </p>
      </div>

      {!isConnected && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Connect a wallet to enable whale alerts
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
                <Bell className="h-5 w-5" />
                Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/50">
                <div className="space-y-0.5">
                  <Label htmlFor="enable">Enable Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive real-time notifications for large transactions
                  </p>
                </div>
                <Switch
                  id="enable"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-amount">Minimum Amount (USD)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  placeholder="10000"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  disabled={isEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Only alert for transactions above this amount
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tracked Tokens</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter token address"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddToken()}
                    disabled={isEnabled}
                  />
                  <Button onClick={handleAddToken} disabled={isEnabled || !newToken.trim()}>
                    Add
                  </Button>
                </div>
                {trackedTokens.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trackedTokens.map((token) => (
                      <Badge key={token} variant="secondary" className="flex items-center gap-1">
                        {token.slice(0, 8)}...
                        <button
                          onClick={() => handleRemoveToken(token)}
                          disabled={isEnabled}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {trackedTokens.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Leave empty to track all tokens
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Alerts</span>
                <Badge variant={isEnabled ? 'default' : 'secondary'}>
                  {isEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEnabled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Enable alerts to start receiving notifications</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin opacity-50" />
                  <p>Waiting for whale movements...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border p-3 space-y-2 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={alert.type === 'buy' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {alert.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{alert.tokenSymbol}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {alert.wallet.slice(0, 8)}...{alert.wallet.slice(-6)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            ${alert.amountUsd.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://solscan.io/tx/${alert.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View Transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>How Whale Alert Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Whale Alert monitors large wallet movements on Solana and sends real-time notifications.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Track transactions above your minimum threshold</li>
            <li>Filter by specific tokens or monitor all tokens</li>
            <li>Receive alerts via Telegram/Discord (coming soon)</li>
            <li>Real-time monitoring powered by Helius Webhooks</li>
          </ul>
          <p className="pt-2">
            <strong>Note:</strong> This is a free tool. Use it to track smart money movements and identify trading opportunities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
