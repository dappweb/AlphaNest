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

// 管理功能模块 (移除了推荐和信誉)
const ADMIN_MODULES = [
  {
    id: 'tokens',
    name: '代币管理',
    icon: Coins,
    description: '添加、更新、移除质押代币',
    color: 'text-yellow-500',
  },
  {
    id: 'insurance',
    name: '保险管理',
    icon: Shield,
    description: '创建保险产品、处理理赔',
    color: 'text-blue-500',
  },
  {
    id: 'funds',
    name: '资金分配',
    icon: TrendingUp,
    description: '管理资金分配比例',
    color: 'text-green-500',
  },
  {
    id: 'system',
    name: '系统控制',
    icon: Settings,
    description: '暂停/恢复合约',
    color: 'text-purple-500',
  },
];

// 保险类型
const INSURANCE_TYPES = [
  { value: 0, label: 'Rug Pull 保护', icon: '🚨' },
  { value: 1, label: '价格下跌保护', icon: '📉' },
  { value: 2, label: '智能合约保障', icon: '🔒' },
  { value: 3, label: '综合保障', icon: '🛡️' },
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

  // 表单状态
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

  // 检查管理员登录状态
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      setError(null);

      // 检查是否有有效的管理员token
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

  // 检查合约 Owner 权限
  const isContractAdmin = adminContract.isAdmin;

  // 处理 EVM 管理员登录
  const handleEvmLogin = useCallback(async () => {
    if (!evmConnected || !evmAddress) {
      setError('请先连接 EVM 钱包');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const message = `AlphaNest Admin Login\n\nWallet: ${evmAddress}\nTimestamp: ${timestamp}\n\n请签名以验证您的管理员身份`;

      // 签名消息
      const signature = await evmSignMessage({ message });

      // 调用登录API
      const adminInfo = await adminLogin(
        evmAddress,
        'bnb', // BSC chain
        signature,
        message
      );

      setAdminInfo(adminInfo);
      setIsAdmin(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      setIsAdmin(false);
      setAdminInfo(null);
    } finally {
      setIsLoggingIn(false);
    }
  }, [evmConnected, evmAddress, evmSignMessage]);

  // 处理 Solana 管理员登录
  const handleSolanaLogin = useCallback(async () => {
    if (!solanaConnected || !solanaPublicKey || !solanaSignMessage) {
      setError('请先连接 Solana 钱包');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const walletAddress = solanaPublicKey.toBase58();
      const timestamp = Date.now();
      const message = `AlphaNest Admin Login\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\n请签名以验证您的管理员身份`;

      // 签名消息
      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await solanaSignMessage(encodedMessage);
      const signature = Buffer.from(signatureBytes).toString('base64');

      // 调用登录API
      const adminInfo = await adminLogin(
        walletAddress,
        'solana',
        signature,
        message
      );

      setAdminInfo(adminInfo);
      setIsAdmin(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      setIsAdmin(false);
      setAdminInfo(null);
    } finally {
      setIsLoggingIn(false);
    }
  }, [solanaConnected, solanaPublicKey, solanaSignMessage]);

  // 处理登出
  const handleLogout = useCallback(async () => {
    try {
      await adminLogout();
      setAdminInfo(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // 添加代币
  const handleAddToken = async () => {
    if (!newToken.address || !newToken.tokenName || !newToken.priceFeed) {
      setError('请填写所有必填字段');
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
      setError(err instanceof Error ? err.message : '添加代币失败');
    }
  };

  // 创建保险产品
  const handleCreateProduct = async () => {
    if (!newProduct.minCoverage || !newProduct.maxCoverage) {
      setError('请填写所有必填字段');
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
      setError(err instanceof Error ? err.message : '创建产品失败');
    }
  };

  // 更新资金分配
  const handleUpdateFunds = async () => {
    try {
      await adminContract.updateFunds.updateAllocation(fundAllocation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">正在验证管理员权限...</p>
      </div>
    );
  }

  // 未连接钱包
  if (!evmConnected && !solanaConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">管理员登录</h2>
        <p className="text-muted-foreground text-center max-w-md">
          请连接钱包以访问管理系统。支持 BSC (EVM) 和 Solana 钱包。
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

  // 未登录或没有管理员权限 - 显示登录界面
  if (!isAdmin || !adminInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Shield className="h-12 w-12 text-primary" />
        <h2 className="text-2xl font-bold">管理员登录</h2>
        <p className="text-muted-foreground text-center max-w-md">
          请使用管理员钱包签名登录。如果您是合约 Owner，将自动获得管理权限。
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm max-w-md text-center">
            {error}
          </div>
        )}

        {/* 合约 Owner 快速登录提示 */}
        {isContractAdmin && (
          <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded-md text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            检测到您是合约 Owner，可直接登录
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* EVM 登录 */}
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
                    登录中...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    BSC 管理员登录
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Solana 登录 */}
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
                    登录中...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Solana 管理员登录
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
            管理员控制台
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            管理 AlphaNest 平台配置
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            {adminInfo.role === 'super_admin' ? '超级管理员' : 
             adminInfo.role === 'admin' ? '管理员' : '操作员'}
          </Badge>
          {isContractAdmin && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
              合约 Owner
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            登出
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

        {/* 代币管理 */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                添加可质押代币
              </CardTitle>
              <CardDescription>
                添加新的代币到质押池
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>代币地址</Label>
                  <Input
                    placeholder="0x..."
                    value={newToken.address || ''}
                    onChange={(e) => setNewToken({ ...newToken, address: e.target.value as `0x${string}` })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>代币名称</Label>
                  <Input
                    placeholder="Four.meme Token"
                    value={newToken.tokenName || ''}
                    onChange={(e) => setNewToken({ ...newToken, tokenName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>小数位</Label>
                  <Input
                    type="number"
                    value={newToken.decimals || 18}
                    onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>基础 APY (基点, 1000 = 10%)</Label>
                  <Input
                    type="number"
                    value={newToken.baseApy || 1000}
                    onChange={(e) => setNewToken({ ...newToken, baseApy: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>奖励倍数 (100 = 1x)</Label>
                  <Input
                    type="number"
                    value={newToken.rewardMultiplier || 100}
                    onChange={(e) => setNewToken({ ...newToken, rewardMultiplier: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最小质押数量</Label>
                  <Input
                    value={newToken.minStakeAmount || '100'}
                    onChange={(e) => setNewToken({ ...newToken, minStakeAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Chainlink 价格喂价地址</Label>
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
                添加代币
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 保险管理 */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                创建保险产品
              </CardTitle>
              <CardDescription>
                创建新的保险产品类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>产品类型</Label>
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
                  <Label>有效期 (天)</Label>
                  <Input
                    type="number"
                    value={newProduct.durationDays || 30}
                    onChange={(e) => setNewProduct({ ...newProduct, durationDays: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>保费率 (基点, 500 = 5%)</Label>
                  <Input
                    type="number"
                    value={newProduct.premiumRate || 500}
                    onChange={(e) => setNewProduct({ ...newProduct, premiumRate: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>赔付率 (基点, 8000 = 80%)</Label>
                  <Input
                    type="number"
                    value={newProduct.coverageRate || 8000}
                    onChange={(e) => setNewProduct({ ...newProduct, coverageRate: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最小保额 (USD)</Label>
                  <Input
                    value={newProduct.minCoverage || '100'}
                    onChange={(e) => setNewProduct({ ...newProduct, minCoverage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>最大保额 (USD)</Label>
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
                创建产品
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 资金分配管理 */}
        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                资金分配比例
              </CardTitle>
              <CardDescription>
                调整质押资金的分配比例 (总和必须为 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-500">开发资金</CardTitle>
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
                    <CardTitle className="text-sm text-green-500">流动性资金</CardTitle>
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
                    <CardTitle className="text-sm text-yellow-500">奖励资金</CardTitle>
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
                    <CardTitle className="text-sm text-purple-500">储备资金</CardTitle>
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
                  总计: {(fundAllocation.devFundRatio + fundAllocation.liquidityRatio + 
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
                  更新分配
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统控制 */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 质押合约控制 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  质押合约
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">合约状态</span>
                  <Badge variant={adminContract.stakingPaused ? 'destructive' : 'default'}>
                    {adminContract.stakingPaused ? '已暂停' : '运行中'}
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
                  {adminContract.stakingPaused ? '恢复合约' : '暂停合约'}
                </Button>
              </CardContent>
            </Card>

            {/* 保险合约控制 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  保险合约
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">合约状态</span>
                  <Badge variant={adminContract.insurancePaused ? 'destructive' : 'default'}>
                    {adminContract.insurancePaused ? '已暂停' : '运行中'}
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
                  {adminContract.insurancePaused ? '恢复合约' : '暂停合约'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 系统状态 */}
          <Card>
            <CardHeader>
              <CardTitle>系统状态总览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">BSC 质押池</span>
                  <Badge variant="outline" className={adminContract.stakingPaused ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}>
                    {adminContract.stakingPaused ? '暂停' : '运行中'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">BSC 保险</span>
                  <Badge variant="outline" className={adminContract.insurancePaused ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}>
                    {adminContract.insurancePaused ? '暂停' : '运行中'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Chainlink</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                    已集成
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Pyth (Solana)</span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                    已集成
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
