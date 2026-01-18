'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Wallet,
  Coins,
  Shield,
  Gift,
  TrendingUp,
} from 'lucide-react';
import {
  useSolanaStaking,
  LockPeriod as SolanaLockPeriod,
} from '@/hooks/use-solana-staking';
import {
  useSolanaInsurance,
  InsuranceType,
} from '@/hooks/use-solana-insurance';
import {
  useSolanaReferral,
  useSolanaHasReferrer,
  useSolanaReferrerInfo,
} from '@/hooks/use-solana-referral';
import { useHeliusTokenPrice, useHeliusTokenBalances } from '@/hooks/use-helius';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function TestSolanaPage() {
  const { connected, publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Hooks
  const solanaStaking = useSolanaStaking();
  const solanaInsurance = useSolanaInsurance();
  const solanaReferral = useSolanaReferral();
  const hasReferrer = useSolanaHasReferrer();
  const referrerInfo = useSolanaReferrerInfo();
  const solPrice = useHeliusTokenPrice('SOL');
  const tokenBalances = useHeliusTokenBalances(publicKey?.toBase58() || '');

  const updateTestResult = (name: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const testWalletConnection = async () => {
    updateTestResult('Wallet Connection', 'pending', 'Testing...');
    try {
      if (!connected || !publicKey) {
        throw new Error('Wallet not connected');
      }
      updateTestResult('Wallet Connection', 'success', `Connected: ${publicKey.toBase58()}`, {
        wallet: wallet?.adapter?.name,
        publicKey: publicKey.toBase58(),
      });
    } catch (error: any) {
      updateTestResult('Wallet Connection', 'error', error.message);
    }
  };

  const testConnection = async () => {
    updateTestResult('RPC Connection', 'pending', 'Testing...');
    try {
      const slot = await connection.getSlot();
      const blockHeight = await connection.getBlockHeight();
      updateTestResult('RPC Connection', 'success', 'Connected to Solana RPC', {
        slot,
        blockHeight,
      });
    } catch (error: any) {
      updateTestResult('RPC Connection', 'error', error.message);
    }
  };

  const testSOLBalance = async () => {
    updateTestResult('SOL Balance', 'pending', 'Testing...');
    try {
      if (!publicKey) throw new Error('Wallet not connected');
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1e9;
      updateTestResult('SOL Balance', 'success', `${solBalance.toFixed(4)} SOL`, {
        lamports: balance,
        sol: solBalance,
      });
    } catch (error: any) {
      updateTestResult('SOL Balance', 'error', error.message);
    }
  };

  const testPriceOracle = async () => {
    updateTestResult('Price Oracle', 'pending', 'Testing...');
    try {
      if (solPrice.isLoading) {
        throw new Error('Price data loading...');
      }
      if (solPrice.error) {
        throw new Error(solPrice.error.message || 'Price fetch failed');
      }
      const priceData = solPrice.price;
      if (!priceData || !priceData.price) {
        throw new Error('Price data not available');
      }
      updateTestResult('Price Oracle', 'success', `SOL: $${priceData.price.toFixed(2)}`, {
        price: priceData.price,
        source: 'Helius API',
      });
    } catch (error: any) {
      updateTestResult('Price Oracle', 'error', error.message);
    }
  };

  const testStakingHooks = async () => {
    updateTestResult('Staking Hooks', 'pending', 'Testing...');
    try {
      await solanaStaking.refetch();
      const poolInfo = solanaStaking.poolInfo;
      const stakeInfo = solanaStaking.stakeInfo;
      updateTestResult('Staking Hooks', 'success', 'Staking hooks working', {
        poolInfo: poolInfo ? 'Available' : 'Not available',
        stakeInfo: stakeInfo ? 'Available' : 'Not available',
      });
    } catch (error: any) {
      updateTestResult('Staking Hooks', 'error', error.message);
    }
  };

  const testInsuranceHooks = async () => {
    updateTestResult('Insurance Hooks', 'pending', 'Testing...');
    try {
      await solanaInsurance.refetch();
      const protocolInfo = solanaInsurance.protocolInfo;
      const policies = solanaInsurance.policies;
      updateTestResult('Insurance Hooks', 'success', 'Insurance hooks working', {
        protocolInfo: protocolInfo ? 'Available' : 'Not available',
        policies: policies?.length || 0,
      });
    } catch (error: any) {
      updateTestResult('Insurance Hooks', 'error', error.message);
    }
  };

  const testReferralHooks = async () => {
    updateTestResult('Referral Hooks', 'pending', 'Testing...');
    try {
      await hasReferrer.refetch();
      await referrerInfo.refetch();
      const hasRef = hasReferrer.hasReferrer;
      const refInfo = referrerInfo.referrerInfo;
      updateTestResult('Referral Hooks', 'success', 'Referral hooks working', {
        hasReferrer: hasRef ? 'Yes' : 'No',
        referrerInfo: refInfo ? 'Available' : 'Not available',
      });
    } catch (error: any) {
      updateTestResult('Referral Hooks', 'error', error.message);
    }
  };

  const testTokenBalances = async () => {
    updateTestResult('Token Balances', 'pending', 'Testing...');
    try {
      if (!publicKey) throw new Error('Wallet not connected');
      const balances = tokenBalances.balances || [];
      updateTestResult('Token Balances', 'success', `Found ${balances.length} tokens`, {
        tokens: balances.length,
      });
    } catch (error: any) {
      updateTestResult('Token Balances', 'error', error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Basic tests
    await testWalletConnection();
    await testConnection();
    await testSOLBalance();
    await testPriceOracle();

    // Feature tests
    await testStakingHooks();
    await testInsuranceHooks();
    await testReferralHooks();
    await testTokenBalances();

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const totalTests = testResults.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solana Business Tests</h1>
          <p className="text-muted-foreground mt-2">
            Test all Solana features: Staking, Insurance, Referral
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning || !connected}
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {!connected && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Please connect your Solana wallet to run tests
          </AlertDescription>
        </Alert>
      )}

      {/* Test Summary */}
      {totalTests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{successCount}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{errorCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalTests}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{result.name}</h3>
                      <Badge 
                        variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <pre className="bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Staking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Pool Info: {solanaStaking.poolInfo ? '✅' : '❌'}</div>
              <div>Stake Info: {solanaStaking.stakeInfo ? '✅' : '❌'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Insurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Protocol: {solanaInsurance.protocolInfo ? '✅' : '❌'}</div>
              <div>Policies: {solanaInsurance.policies?.length || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Referral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Has Referrer: {hasReferrer.hasReferrer ? '✅' : '❌'}</div>
              <div>Referrer Info: {referrerInfo.referrerInfo ? '✅' : '❌'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
