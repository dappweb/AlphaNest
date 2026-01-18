'use client';

import React, { useState } from 'react';
import { AlertTriangle, Shield, Loader2, Zap, Rocket, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatUSD } from '@/lib/utils';
import { 
  useSolanaInsurance,
  useSolanaProductInfo,
  useCalculatePremium,
  InsuranceType, 
  INSURANCE_TYPE_LABELS,
  INSURANCE_TYPE_ICONS,
} from '@/hooks/use-solana-insurance';

// 预设的保险产品 - 仅支持 pump.fun 代币
// 根据 bonding curve 状态提供不同费率（确保盈利）
const INSURANCE_PRODUCTS = [
  {
    id: 1,
    platform: 'pump.fun',
    chain: 'Solana',
    chainIcon: '🟣',
    type: InsuranceType.RugPull,
    name: 'Rug Pull Protection (Bonding Curve)',
    description: '保护 bonding curve 阶段的 pump.fun 代币免受 Rug Pull',
    premiumRate: 7,  // 7% - bonding curve 阶段高风险，确保盈利
    coverageRate: 100,
    minCoverage: 100,
    maxCoverage: 10000,
    duration: 30,
    color: 'purple',
    bondingCurveStage: true,  // bonding curve 阶段标识
  },
  {
    id: 2,
    platform: 'pump.fun',
    chain: 'Solana',
    chainIcon: '🟣',
    type: InsuranceType.RugPull,
    name: 'Rug Pull Protection (Completed)',
    description: '保护已完成 bonding curve 的 pump.fun 代币',
    premiumRate: 3,  // 3% - 完成状态相对稳定
    coverageRate: 100,
    minCoverage: 100,
    maxCoverage: 10000,
    duration: 30,
    color: 'purple',
    bondingCurveStage: false,  // 已完成标识
  },
  {
    id: 3,
    platform: 'pump.fun',
    chain: 'Solana',
    chainIcon: '🟣',
    type: InsuranceType.PriceDrop,
    name: 'Price Drop Protection (Bonding Curve)',
    description: '保护 bonding curve 阶段的 pump.fun 代币免受价格暴跌',
    premiumRate: 8,  // 8% - bonding curve 阶段高风险
    coverageRate: 100,
    minCoverage: 500,
    maxCoverage: 50000,
    duration: 90,
    color: 'purple',
    bondingCurveStage: true,
  },
  {
    id: 4,
    platform: 'pump.fun',
    chain: 'Solana',
    chainIcon: '🟣',
    type: InsuranceType.Comprehensive,
    name: 'Comprehensive Coverage (Bonding Curve)',
    description: 'bonding curve 阶段全面保护',
    premiumRate: 10,  // 10% - 综合保险，高风险
    coverageRate: 100,
    minCoverage: 1000,
    maxCoverage: 100000,
    duration: 365,
    color: 'purple',
    bondingCurveStage: true,
  },
  {
    id: 5,
    platform: 'pump.fun',
    chain: 'Solana',
    chainIcon: '🟣',
    type: InsuranceType.Comprehensive,
    name: 'Comprehensive Coverage (Completed)',
    description: '已完成 bonding curve 的全面保护',
    premiumRate: 6,  // 6% - 完成状态相对稳定
    coverageRate: 100,
    minCoverage: 1000,
    maxCoverage: 100000,
    duration: 365,
    color: 'purple',
    bondingCurveStage: false,
  },
];

interface PurchaseModalProps {
  product: typeof INSURANCE_PRODUCTS[0] | null;
  onClose: () => void;
}

function PurchaseModal({ product, onClose }: PurchaseModalProps) {
  const { connected } = useWallet();
  const { purchase, usdcBalance } = useSolanaInsurance();
  const [coverageAmount, setCoverageAmount] = useState('1000');
  
  const { premium } = useCalculatePremium(
    product?.type || InsuranceType.RugPull, 
    parseFloat(coverageAmount) || 0
  );
  const calcLoading = false; // 保费计算是同步的

  if (!product) return null;

  const handlePurchase = async () => {
    if (!connected) {
      alert('Please connect your Solana wallet first');
      return;
    }
    
    const coverage = parseFloat(coverageAmount);
    if (!coverage || coverage <= 0) {
      alert('Please enter a valid coverage amount');
      return;
    }
    
    if (coverage < product.minCoverage || coverage > product.maxCoverage) {
      alert(`Coverage amount must be between $${product.minCoverage} and $${product.maxCoverage}`);
      return;
    }
    
    try {
      await purchase.purchaseInsurance(product.type, coverage);
      // 延迟关闭，让用户看到成功消息
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const isLoading = purchase.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{INSURANCE_TYPE_ICONS[product.type]}</span>
            <div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <span>{product.chainIcon}</span>
                {product.platform} {product.bondingCurveStage ? '(Bonding Curve)' : '(Completed)'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-muted-foreground">Coverage Rate</p>
              <p className="text-lg font-bold text-green-500">{product.coverageRate}%</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-muted-foreground">Duration</p>
              <p className="text-lg font-bold">{product.duration} days</p>
            </div>
          </div>

          {/* Coverage Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Coverage Amount (USDT)</label>
            <Input
              type="number"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              min={product.minCoverage}
              max={product.maxCoverage}
              className="h-11"
            />
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setCoverageAmount(val.toString())}
                  disabled={val < product.minCoverage || val > product.maxCoverage}
                >
                  ${val}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Min: ${product.minCoverage} | Max: ${product.maxCoverage}
            </p>
          </div>

          {/* Premium */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Premium ({product.premiumRate}%)</span>
              <span className="text-lg font-bold text-blue-500">
                {calcLoading ? '...' : `$${premium}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-blue-500 hover:bg-blue-600" 
              onClick={handlePurchase}
              disabled={!connected || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Purchase
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {purchase.isSuccess && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm text-green-500">
                Insurance purchased successfully! Policy ID: {purchase.txHash?.slice(0, 8)}...
              </AlertDescription>
            </Alert>
          )}
          
          {purchase.error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-sm text-red-500">
                {purchase.error.message || 'Purchase failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InsuranceProducts() {
  const [selectedProduct, setSelectedProduct] = useState<typeof INSURANCE_PRODUCTS[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'bonding' | 'completed'>('all');

  // 仅显示 pump.fun 代币产品，根据 bonding curve 状态筛选
  const filteredProducts = INSURANCE_PRODUCTS.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'bonding') return p.bondingCurveStage === true;
    if (activeTab === 'completed') return p.bondingCurveStage === false;
    return true;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Insurance Products
              </CardTitle>
              <CardDescription>
                Choose protection for your meme token investments
              </CardDescription>
            </div>
            
            {/* Bonding Curve Status Filter */}
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
              <Button
                size="sm"
                variant={activeTab === 'all' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('all')}
                className="text-xs"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'bonding' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('bonding')}
                className={`text-xs ${activeTab === 'bonding' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              >
                <Zap className="h-3 w-3 mr-1" />
                Bonding Curve
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'completed' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('completed')}
                className={`text-xs ${activeTab === 'completed' ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
              >
                <Rocket className="h-3 w-3 mr-1" />
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className={`group hover:shadow-lg transition-all cursor-pointer border-2 ${
                  product.color === 'yellow' 
                    ? 'border-yellow-500/20 hover:border-yellow-500/50' 
                    : product.color === 'purple'
                    ? 'border-purple-500/20 hover:border-purple-500/50'
                    : 'border-blue-500/20 hover:border-blue-500/50'
                }`}
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      product.color === 'yellow' 
                        ? 'bg-yellow-500/10' 
                        : product.color === 'purple'
                        ? 'bg-purple-500/10'
                        : 'bg-blue-500/10'
                    }`}>
                      <span className="text-2xl">{INSURANCE_TYPE_ICONS[product.type]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{product.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            product.color === 'yellow' 
                              ? 'border-yellow-500/30 text-yellow-500' 
                              : product.color === 'purple'
                              ? 'border-purple-500/30 text-purple-500'
                              : 'border-blue-500/30 text-blue-500'
                          }`}
                        >
                          {product.chainIcon} {product.chain}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Premium</p>
                          <p className="text-sm font-bold">{product.premiumRate}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Coverage</p>
                          <p className="text-sm font-bold text-green-500">{product.coverageRate}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Duration</p>
                          <p className="text-sm font-bold">{product.duration}d</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full mt-3 h-9 text-sm ${
                      product.color === 'yellow' 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : product.color === 'purple'
                        ? 'bg-purple-500 hover:bg-purple-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    Get Coverage
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <PurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
