'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Settings, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  LogOut,
  Plus,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { 
  adminLogin, 
  adminLogout, 
  getCurrentAdmin, 
  getAdminInfo,
  isAdminTokenExpired,
  type AdminInfo,
} from '@/lib/admin-auth';
import {
  useAdminContract,
  useIsContractOwner,
  useContractPaused,
  type TokenConfig,
  type InsuranceProduct,
  type FundAllocation,
} from '@/hooks/use-admin-contract';

// Admin modules
const ADMIN_MODULES = [
  {
    id: 'tokens',
    name: 'Token Management',
    icon: Coins,
    description: 'Add, update, remove staking tokens',
    color: 'text-yellow-500',
  },
  {
    id: 'insurance',
    name: 'Insurance Management',
    icon: Shield,
    description: 'Create insurance products, process claims',
    color: 'text-blue-500',
  },
  {
    id: 'funds',
    name: 'Fund Allocation',
    icon: TrendingUp,
    description: 'Manage fund allocation ratios',
    color: 'text-green-500',
  },
  {
    id: 'system',
    name: 'System Control',
    icon: Settings,
    description: 'Pause/resume contracts',
    color: 'text-purple-500',
  },
];

// Insurance types
const INSURANCE_TYPES = [
  { value: 0, label: 'Rug Pull Protection', icon: '🚨' },
  { value: 1, label: 'Price Drop Protection', icon: '📉' },
  { value: 2, label: 'Smart Contract Coverage', icon: '🔒' },
  { value: 3, label: 'Comprehensive Coverage', icon: '🛡️' },
];

export default function AdminPage() {
  // Solana wallet
  const { connected: solanaConnected, publicKey: solanaPublicKey, signMessage: solanaSignMessage } = useWallet();
  
  // EVM wallet (BSC)
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { signMessageAsync: evmSignMessage } = useSignMessage();
  
  // Admin contract hooks
  const adminContract = useAdminContract();
  
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<string>('tokens');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'solana' | 'evm'>('evm');

  // Form state
  const [newToken, setNewToken] = useState<Partial<TokenConfig>>({
    tokenName: '',
    decimals: 18,
    baseApy: 1000, // 10%
    rewardMultiplier: 100,
    minStakeAmount: '100',
  });
  
  const [newProduct, setNewProduct] = useState<Partial<InsuranceProduct>>({
    productType: 0,
    premiumRate: 500, // 5%
    coverageRate: 8000, // 80%
    minCoverage: '100',
    maxCoverage: '10000',
    durationDays: 30,
  });

  const [fundAllocation, setFundAllocation] = useState<FundAllocation>({
    devFundRatio: 4000,
    liquidityRatio: 3000,
    rewardRatio: 2000,
    reserveRatio: 1000,
  });

  // Check admin login status
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      setError(null);

      // Check if there is a valid admin token
      const info = getAdminInfo();
      if (info && !isAdminTokenExpired()) {
        try {
          const currentAdmin = await getCurrentAdmin();
          if (currentAdmin) {
            setAdminInfo(currentAdmin);
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            setAdminInfo(null);
          }
        } catch (err) {
          console.error('Check admin status error:', err);
          setIsAdmin(false);
          setAdminInfo(null);
        }
      } else {
        setIsAdmin(false);
        setAdminInfo(null);
      }

      setIsLoading(false);
    };

    checkAdminStatus();
  }, []);

  // Check contract Owner permissions
  const isContractAdmin = adminContract.isAdmin;

  // Handle EVM admin login
  const handleEvmLogin = useCallback(async () => {
    if (!evmConnected || !evmAddress) {
      setError('Please connect EVM wallet first');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const message = `PopCowDefi Admin Login\n\nWallet: ${evmAddress}\nTimestamp: ${timestamp}\n\nPlease sign to verify your admin identity`;

      // Sign message
      const signature = await evmSignMessage({ message });

      // Call login API
      const adminInfo = await adminLogin(
        evmAddress,
        'bnb', // BSC chain
        signature,
        message
      );

      setAdminInfo(adminInfo);
      setIsAdmin(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsAdmin(false);
      setAdminInfo(null);
    } finally {
      setIsLoggingIn(false);
    }
  }, [evmConnected, evmAddress, evmSignMessage]);

  // Handle Solana admin login
  const handleSolanaLogin = useCallback(async () => {
    if (!solanaConnected || !solanaPublicKey || !solanaSignMessage) {
      setError('Please connect Solana wallet first');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const walletAddress = solanaPublicKey.toBase58();
      const timestamp = Date.now();
      const message = `PopCowDefi Admin Login\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nPlease sign to verify your admin identity`;

      // Sign message
      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await solanaSignMessage(encodedMessage);
      const signature = Buffer.from(signatureBytes).toString('base64');

      // Call login API
      const adminInfo = await adminLogin(
        walletAddress,
        'solana',
        signature,
        message
      );

      setAdminInfo(adminInfo);
      setIsAdmin(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsAdmin(false);
      setAdminInfo(null);
    } finally {
      setIsLoggingIn(false);
    }
  }, [solanaConnected, solanaPublicKey, solanaSignMessage]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await adminLogout();
      setAdminInfo(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // Add token
  const handleAddToken = async () => {
    if (!newToken.address || !newToken.tokenName || !newToken.priceFeed) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await adminContract.addToken.addToken(newToken as TokenConfig);
      setError(null);
      // Reset form
      setNewToken({
        tokenName: '',
        decimals: 18,
        baseApy: 1000,
        rewardMultiplier: 100,
        minStakeAmount: '100',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add token');
    }
  };

  // Create insurance product
  const handleCreateProduct = async () => {
    if (!newProduct.minCoverage || !newProduct.maxCoverage) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await adminContract.createProduct.createProduct(newProduct as InsuranceProduct);
      setError(null);
      // Reset form
      setNewProduct({
        productType: 0,
        premiumRate: 500,
        coverageRate: 8000,
        minCoverage: '100',
        maxCoverage: '10000',
        durationDays: 30,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  // Update fund allocation
  const handleUpdateFunds = async () => {
    try {
      await adminContract.updateFunds.updateAllocation(fundAllocation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Verifying admin permissions...</p>
      </div>
    );
  }

  // Wallet not connected
  if (!evmConnected && !solanaConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Admin Login</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please connect your wallet to access the admin system. Supports BSC (EVM) and Solana wallets.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col items-center gap-2">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
              BSC / EVM
            </Badge>
            <ConnectButton />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
              Solana
            </Badge>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in or no admin permissions - show login interface
  if (!isAdmin || !adminInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Shield className="h-12 w-12 text-primary" />
        <h2 className="text-2xl font-bold">Admin Login</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please sign in with your admin wallet. If you are the contract Owner, you will automatically get admin permissions.
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm max-w-md text-center">
            {error}
          </div>
        )}

        {/* Contract Owner quick login hint */}
        {isContractAdmin && (
          <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded-md text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Detected as contract Owner, you can login directly
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* EVM login */}
          {evmConnected && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground font-mono">
                BSC: {evmAddress?.slice(0, 8)}...{evmAddress?.slice(-6)}
              </p>
              <Button 
                onClick={handleEvmLogin} 
                disabled={isLoggingIn}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    BSC Admin Login
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Solana login */}
          {solanaConnected && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground font-mono">
                Solana: {solanaPublicKey?.toString().slice(0, 8)}...{solanaPublicKey?.toString().slice(-6)}
              </p>
              <Button 
                onClick={handleSolanaLogin} 
                disabled={isLoggingIn}
                variant="outline"
                className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Solana Admin Login
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <ConnectButton />
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Admin Console
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage PopCowDefi platform configuration
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            {adminInfo.role === 'super_admin' ? 'Super Admin' : 
             adminInfo.role === 'admin' ? 'Admin' : 'Operator'}
          </Badge>
          {isContractAdmin && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
              Contract Owner
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Admin Modules */}
      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid w-full grid-cols-4">
          {ADMIN_MODULES.map((module) => (
            <TabsTrigger key={module.id} value={module.id} className="flex items-center gap-1 sm:gap-2">
              <module.icon className={`h-4 w-4 ${module.color}`} />
              <span className="hidden sm:inline text-xs sm:text-sm">{module.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Token management */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Add Stakable Token
              </CardTitle>
              <CardDescription>
                Add a new token to the staking pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Token Address</Label>
                  <Input
                    placeholder="0x..."
                    value={newToken.address || ''}
                    onChange={(e) => setNewToken({ ...newToken, address: e.target.value as `0x${string}` })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token Name</Label>
                  <Input
                    placeholder="Four.meme Token"
                    value={newToken.tokenName || ''}
                    onChange={(e) => setNewToken({ ...newToken, tokenName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Decimals</Label>
                  <Input
                    type="number"
                    value={newToken.decimals || 18}
                    onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base APY (basis points, 1000 = 10%)</Label>
                  <Input
                    type="number"
                    value={newToken.baseApy || 1000}
                    onChange={(e) => setNewToken({ ...newToken, baseApy: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reward Multiplier (100 = 1x)</Label>
                  <Input
                    type="number"
                    value={newToken.rewardMultiplier || 100}
                    onChange={(e) => setNewToken({ ...newToken, rewardMultiplier: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Stake Amount</Label>
                  <Input
                    value={newToken.minStakeAmount || '100'}
                    onChange={(e) => setNewToken({ ...newToken, minStakeAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Chainlink Price Feed Address</Label>
                  <Input
                    placeholder="0x..."
                    value={newToken.priceFeed || ''}
                    onChange={(e) => setNewToken({ ...newToken, priceFeed: e.target.value as `0x${string}` })}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                onClick={handleAddToken}
                disabled={adminContract.addToken.isPending}
              >
                {adminContract.addToken.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Token
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance management */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Create Insurance Product
              </CardTitle>
              <CardDescription>
                Create a new insurance product type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <select
                    className="w-full p-2 rounded-md border bg-background"
                    value={newProduct.productType}
                    onChange={(e) => setNewProduct({ ...newProduct, productType: parseInt(e.target.value) })}
                  >
                    {INSURANCE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    value={newProduct.durationDays || 30}
                    onChange={(e) => setNewProduct({ ...newProduct, durationDays: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Premium Rate (basis points, 500 = 5%)</Label>
                  <Input
                    type="number"
                    value={newProduct.premiumRate || 500}
                    onChange={(e) => setNewProduct({ ...newProduct, premiumRate: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Rate (basis points, 8000 = 80%)</Label>
                  <Input
                    type="number"
                    value={newProduct.coverageRate || 8000}
                    onChange={(e) => setNewProduct({ ...newProduct, coverageRate: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Coverage (USD)</Label>
                  <Input
                    value={newProduct.minCoverage || '100'}
                    onChange={(e) => setNewProduct({ ...newProduct, minCoverage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Coverage (USD)</Label>
                  <Input
                    value={newProduct.maxCoverage || '10000'}
                    onChange={(e) => setNewProduct({ ...newProduct, maxCoverage: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="w-full"
                onClick={handleCreateProduct}
                disabled={adminContract.createProduct.isPending}
              >
                {adminContract.createProduct.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Product
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fund allocation management */}
        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Fund Allocation Ratio
              </CardTitle>
              <CardDescription>
                Adjust the allocation ratio of staking funds (total must be 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-500">Dev Fund</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="number"
                      value={fundAllocation.devFundRatio / 100}
                      onChange={(e) => setFundAllocation({ 
                        ...fundAllocation, 
                        devFundRatio: parseFloat(e.target.value) * 100 
                      })}
                      className="text-xl font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">%</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-500">Liquidity Fund</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="number"
                      value={fundAllocation.liquidityRatio / 100}
                      onChange={(e) => setFundAllocation({ 
                        ...fundAllocation, 
                        liquidityRatio: parseFloat(e.target.value) * 100 
                      })}
                      className="text-xl font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">%</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/5 border-yellow-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-yellow-500">Reward Fund</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="number"
                      value={fundAllocation.rewardRatio / 100}
                      onChange={(e) => setFundAllocation({ 
                        ...fundAllocation, 
                        rewardRatio: parseFloat(e.target.value) * 100 
                      })}
                      className="text-xl font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">%</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-purple-500">Reserve Fund</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="number"
                      value={fundAllocation.reserveRatio / 100}
                      onChange={(e) => setFundAllocation({ 
                        ...fundAllocation, 
                        reserveRatio: parseFloat(e.target.value) * 100 
                      })}
                      className="text-xl font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">%</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Total: {(fundAllocation.devFundRatio + fundAllocation.liquidityRatio + 
                         fundAllocation.rewardRatio + fundAllocation.reserveRatio) / 100}%
                </p>
                <Button 
                  onClick={handleUpdateFunds}
                  disabled={adminContract.updateFunds.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {adminContract.updateFunds.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update Allocation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System control */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Staking contract control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Staking Contract
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contract Status</span>
                  <Badge variant={adminContract.stakingPaused ? 'destructive' : 'default'}>
                    {adminContract.stakingPaused ? 'Paused' : 'Running'}
                  </Badge>
                </div>
                <Button
                  variant={adminContract.stakingPaused ? 'default' : 'destructive'}
                  className="w-full"
                  onClick={() => adminContract.toggleStakingPause.togglePause(!adminContract.stakingPaused)}
                  disabled={adminContract.toggleStakingPause.isPending}
                >
                  {adminContract.toggleStakingPause.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : adminContract.stakingPaused ? (
                    <Play className="h-4 w-4 mr-2" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  {adminContract.stakingPaused ? 'Resume Contract' : 'Pause Contract'}
                </Button>
              </CardContent>
            </Card>

            {/* Insurance contract control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Insurance Contract
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contract Status</span>
                  <Badge variant={adminContract.insurancePaused ? 'destructive' : 'default'}>
                    {adminContract.insurancePaused ? 'Paused' : 'Running'}
                  </Badge>
                </div>
                <Button
                  variant={adminContract.insurancePaused ? 'default' : 'destructive'}
                  className="w-full"
                  onClick={() => adminContract.toggleInsurancePause.togglePause(!adminContract.insurancePaused)}
                  disabled={adminContract.toggleInsurancePause.isPending}
                >
                  {adminContract.toggleInsurancePause.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : adminContract.insurancePaused ? (
                    <Play className="h-4 w-4 mr-2" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  {adminContract.insurancePaused ? 'Resume Contract' : 'Pause Contract'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">BSC Staking Pool</span>
                  <Badge variant="outline" className={adminContract.stakingPaused ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}>
                    {adminContract.stakingPaused ? 'Paused' : 'Running'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">BSC Insurance</span>
                  <Badge variant="outline" className={adminContract.insurancePaused ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}>
                    {adminContract.insurancePaused ? 'Paused' : 'Running'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Chainlink</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                    Integrated
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Pyth (Solana)</span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                    Integrated
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
