'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Lock,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Calculator,
  Wallet,
  Info,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// 保险产品配置
const INSURANCE_PRODUCTS = [
  {
    id: 0,
    type: 'rug_pull',
    name: 'Rug Pull 保险',
    icon: '🔴',
    emoji: '💥',
    description: '保护您免受项目方跑路损失',
    premiumRate: 500, // 5%
    coverageRate: 8000, // 80%
    minCoverage: 100,
    maxCoverage: 50000,
    durations: [30, 90, 180],
    color: 'from-red-500 to-orange-500',
    features: [
      '项目方跑路赔付',
      '流动性被抽走赔付',
      '合约被关闭赔付',
    ],
    conditions: [
      '代币价格下跌 > 95%',
      '流动性下降 > 90%',
      '项目方钱包清空',
    ],
  },
  {
    id: 1,
    type: 'price_drop',
    name: '价格下跌保险',
    icon: '📉',
    emoji: '📊',
    description: '设置止损价位，价格保护',
    premiumRate: 300, // 3%
    coverageRate: 7000, // 70%
    minCoverage: 50,
    maxCoverage: 100000,
    durations: [7, 14, 30],
    color: 'from-blue-500 to-cyan-500',
    features: [
      '自定义止损价位',
      '价格下跌自动赔付',
      '灵活的保险期限',
    ],
    conditions: [
      '代币价格跌破止损价',
      '保险期内有效',
    ],
  },
  {
    id: 2,
    type: 'smart_contract',
    name: '智能合约保险',
    icon: '🔒',
    emoji: '🛡️',
    description: '合约漏洞和黑客攻击保障',
    premiumRate: 200, // 2%
    coverageRate: 9000, // 90%
    minCoverage: 100,
    maxCoverage: 200000,
    durations: [30, 90, 365],
    color: 'from-purple-500 to-pink-500',
    features: [
      '合约漏洞赔付',
      '黑客攻击赔付',
      '预言机攻击赔付',
    ],
    conditions: [
      '链上攻击证据',
      '第三方安全确认',
      'DAO 投票通过',
    ],
  },
  {
    id: 3,
    type: 'comprehensive',
    name: '综合保险',
    icon: '💎',
    emoji: '⭐',
    description: '全方位资产保护方案',
    premiumRate: 800, // 8%
    coverageRate: 8500, // 85%
    minCoverage: 500,
    maxCoverage: 500000,
    durations: [30, 90, 180, 365],
    color: 'from-yellow-500 to-amber-500',
    popular: true,
    features: [
      '包含所有保障类型',
      '最高赔付比例',
      '优先理赔处理',
    ],
    conditions: [
      '满足任一保障条件',
      'VIP 专属服务',
    ],
  },
];

// 保单状态
type PolicyStatus = 'active' | 'expired' | 'claimed' | 'cancelled';

interface UserPolicy {
  id: string;
  productType: string;
  coverageAmount: number;
  premiumPaid: number;
  startTime: number;
  endTime: number;
  status: PolicyStatus;
}

export default function CowGuardPage() {
  const { connected, publicKey } = useWallet();
  
  const [selectedProduct, setSelectedProduct] = useState(INSURANCE_PRODUCTS[3]); // 默认综合保险
  const [coverageAmount, setCoverageAmount] = useState(1000);
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('purchase');
  
  // 用户保单
  const [userPolicies, setUserPolicies] = useState<UserPolicy[]>([]);
  
  // 计算保费
  const calculatePremium = (coverage: number, product: typeof INSURANCE_PRODUCTS[0]) => {
    return (coverage * product.premiumRate) / 10000;
  };
  
  // 计算最高赔付
  const calculateMaxPayout = (coverage: number, product: typeof INSURANCE_PRODUCTS[0]) => {
    return (coverage * product.coverageRate) / 10000;
  };
  
  const premium = calculatePremium(coverageAmount, selectedProduct);
  const maxPayout = calculateMaxPayout(coverageAmount, selectedProduct);

  // 购买保险
  const handlePurchase = async () => {
    if (!connected || coverageAmount < selectedProduct.minCoverage) return;
    
    setIsLoading(true);
    try {
      // TODO: 调用合约购买保险
      console.log('Purchasing insurance:', {
        product: selectedProduct.type,
        coverage: coverageAmount,
        duration,
        premium,
      });
      
      // 模拟交易
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 添加到用户保单
      const newPolicy: UserPolicy = {
        id: Date.now().toString(),
        productType: selectedProduct.type,
        coverageAmount,
        premiumPaid: premium,
        startTime: Date.now(),
        endTime: Date.now() + duration * 24 * 60 * 60 * 1000,
        status: 'active',
      };
      setUserPolicies([...userPolicies, newPolicy]);
      
      // 重置表单
      setCoverageAmount(1000);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">🛡️</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              CowGuard 保险
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            为您的 POP 系列代币提供全方位资产保护，降低投资风险，安心持有
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Shield className="h-3 w-3 mr-1" />
              去中心化理赔
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
              <Zap className="h-3 w-3 mr-1" />
              快速赔付
            </Badge>
          </div>
        </div>

        {/* 全局统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">保险池规模</p>
              <p className="text-2xl font-bold text-green-500">$2.5M</p>
              <p className="text-xs text-muted-foreground">USDC</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">活跃保单</p>
              <p className="text-2xl font-bold text-blue-500">1,234</p>
              <p className="text-xs text-muted-foreground">份</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">总保额</p>
              <p className="text-2xl font-bold text-orange-500">$15.6M</p>
              <p className="text-xs text-muted-foreground">USDC</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">已赔付</p>
              <p className="text-2xl font-bold text-purple-500">$856K</p>
              <p className="text-xs text-muted-foreground">USDC</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：产品选择和购买 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 保险产品选择 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  选择保险产品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INSURANCE_PRODUCTS.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setDuration(product.durations[0]);
                      }}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-left',
                        selectedProduct.id === product.id
                          ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                          : 'border-border hover:border-green-500/50 hover:bg-secondary/50'
                      )}
                    >
                      {product.popular && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-green-500 text-white text-[10px]">
                            推荐
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{product.icon}</span>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            保费 {product.premiumRate / 100}%
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          赔付率 {product.coverageRate / 100}%
                        </span>
                        <Badge variant="outline" className={cn(
                          'bg-gradient-to-r bg-clip-text text-transparent',
                          product.color
                        )}>
                          ${product.minCoverage} - ${product.maxCoverage.toLocaleString()}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 购买保险 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{selectedProduct.emoji}</span>
                    {selectedProduct.name}
                  </CardTitle>
                  <Badge className={cn('bg-gradient-to-r text-white', selectedProduct.color)}>
                    赔付率 {selectedProduct.coverageRate / 100}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 保额设置 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">保额 (USDC)</label>
                    <span className="text-sm text-muted-foreground">
                      范围: ${selectedProduct.minCoverage} - ${selectedProduct.maxCoverage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      value={coverageAmount}
                      onChange={(e) => setCoverageAmount(Number(e.target.value))}
                      min={selectedProduct.minCoverage}
                      max={selectedProduct.maxCoverage}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      {[1000, 5000, 10000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setCoverageAmount(amount)}
                          className={cn(
                            coverageAmount === amount && 'border-green-500 bg-green-500/10'
                          )}
                        >
                          ${amount.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Slider
                    value={[coverageAmount]}
                    onValueChange={([value]) => setCoverageAmount(value)}
                    min={selectedProduct.minCoverage}
                    max={selectedProduct.maxCoverage}
                    step={100}
                    className="mt-2"
                  />
                </div>

                {/* 保险期限 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">保险期限</label>
                  <div className="flex gap-2">
                    {selectedProduct.durations.map((d) => (
                      <Button
                        key={d}
                        variant="outline"
                        onClick={() => setDuration(d)}
                        className={cn(
                          'flex-1',
                          duration === d && 'border-green-500 bg-green-500/10'
                        )}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {d} 天
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 费用计算 */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">保额</span>
                    <span className="font-medium">${coverageAmount.toLocaleString()} USDC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">保费率</span>
                    <span className="font-medium">{selectedProduct.premiumRate / 100}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">保险期限</span>
                    <span className="font-medium">{duration} 天</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">保费</span>
                      <span className="text-lg font-bold text-green-500">
                        ${premium.toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-green-600">
                    <span className="text-sm">最高赔付</span>
                    <span className="font-bold">${maxPayout.toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* 购买按钮 */}
                <Button
                  onClick={handlePurchase}
                  disabled={!connected || isLoading || coverageAmount < selectedProduct.minCoverage}
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      购买保险 - ${premium.toFixed(2)} USDC
                    </>
                  )}
                </Button>

                {!connected && (
                  <p className="text-center text-sm text-muted-foreground">
                    请先连接钱包
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：保障说明和我的保单 */}
          <div className="space-y-4">
            {/* 保障范围 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  保障范围
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedProduct.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 理赔条件 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  理赔条件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedProduct.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{condition}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 我的保单 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-orange-500" />
                  我的保单
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPolicies.length === 0 ? (
                  <div className="text-center py-6">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      暂无保单
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      购买保险后在此查看
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userPolicies.map((policy) => {
                      const product = INSURANCE_PRODUCTS.find(p => p.type === policy.productType);
                      return (
                        <div
                          key={policy.id}
                          className="p-3 rounded-lg border bg-secondary/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {product?.icon} {product?.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                policy.status === 'active' && 'bg-green-500/10 text-green-500 border-green-500/30',
                                policy.status === 'expired' && 'bg-gray-500/10 text-gray-500 border-gray-500/30',
                                policy.status === 'claimed' && 'bg-blue-500/10 text-blue-500 border-blue-500/30',
                              )}
                            >
                              {policy.status === 'active' && '生效中'}
                              {policy.status === 'expired' && '已过期'}
                              {policy.status === 'claimed' && '已理赔'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">保额:</span>
                              <span className="ml-1">${policy.coverageAmount}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">保费:</span>
                              <span className="ml-1">${policy.premiumPaid.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            到期: {new Date(policy.endTime).toLocaleDateString()}
                          </div>
                          {policy.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                            >
                              申请理赔
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 理赔流程 */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">理赔流程</span>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center">1</span>
                    提交理赔申请
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center">2</span>
                    上传证据材料
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center">3</span>
                    DAO 投票审核
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 text-xs flex items-center justify-center">4</span>
                    自动赔付到账
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部说明 */}
        <Card className="bg-secondary/30">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">资金安全</p>
                  <p className="text-sm text-muted-foreground">
                    保险池资金由智能合约管理，透明可查
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">快速理赔</p>
                  <p className="text-sm text-muted-foreground">
                    简单案例 24 小时内完成，复杂案例 3-7 天
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">公正透明</p>
                  <p className="text-sm text-muted-foreground">
                    DAO 投票决定理赔，社区共同监督
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
