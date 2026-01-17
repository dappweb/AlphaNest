'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatUSD, formatAddress } from '@/lib/utils';
import { usePurchaseInsurance, useUsdcBalance, InsuranceType, INSURANCE_TYPE_LABELS } from '@/hooks/use-cowguard-insurance';
import { getInsuranceProducts, type InsuranceProduct as ApiInsuranceProduct } from '@/lib/api';

interface InsuranceProduct {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  address: string;
  premiumRate: number;
  poolSize: number;
  currentOdds: { rug: number; safe: number };
  expiresIn: string;
  riskLevel: 'low' | 'medium' | 'high';
  // Contract data
  poolId: number;
  expiresAt: number;
}

function getRiskBadge(level: string) {
  switch (level) {
    case 'high':
      return <Badge variant="destructive">High Risk</Badge>;
    case 'medium':
      return <Badge variant="warning">Medium Risk</Badge>;
    default:
      return <Badge variant="success">Low Risk</Badge>;
  }
}

interface BuyModalProps {
  product: InsuranceProduct | null;
  onClose: () => void;
}

function BuyModal({ product, onClose }: BuyModalProps) {
  const { isConnected } = useAccount();
  const { balance } = useUsdcBalance();
  const { purchasePolicy, isApproving, isPurchasing, isApproveSuccess, isPurchaseSuccess } = usePurchasePolicy();
  
  const [amount, setAmount] = useState('100');
  const [position, setPosition] = useState<Position>(Position.SAFE);

  if (!product) return null;

  const potentialPayout = parseFloat(amount) * (position === Position.RUG ? product.currentOdds.rug : product.currentOdds.safe);
  const isLoading = isApproving || isPurchasing;

  const handlePurchase = async () => {
    try {
      await purchasePolicy(product.poolId, position, amount);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  if (isPurchaseSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <Card className="relative w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-2">Purchase Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your insurance policy for {product.tokenSymbol} has been created.
            </p>
            <Button onClick={onClose}>View My Policies</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Buy Insurance - {product.tokenSymbol}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Token</span>
              <span className="font-medium">{product.tokenName} ({product.chain})</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Pool Size</span>
              <span className="font-medium">{formatUSD(product.poolSize)}</span>
            </div>
          </div>

          {/* Position Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Prediction</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={position === Position.RUG ? 'destructive' : 'outline'}
                className="h-16 flex-col"
                onClick={() => setPosition(Position.RUG)}
              >
                <TrendingDown className="h-5 w-5 mb-1" />
                <span>Bet Rug</span>
                <span className="text-xs opacity-70">{product.currentOdds.rug}x payout</span>
              </Button>
              <Button
                variant={position === Position.SAFE ? 'default' : 'outline'}
                className="h-16 flex-col bg-success hover:bg-success/90"
                onClick={() => setPosition(Position.SAFE)}
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span>Bet Safe</span>
                <span className="text-xs opacity-70">{product.currentOdds.safe}x payout</span>
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Amount (USDC)</label>
              <span className="text-xs text-muted-foreground">Balance: {parseFloat(balance).toFixed(2)} USDC</span>
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="10"
            />
            <div className="flex gap-2">
              {['50', '100', '250', '500'].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setAmount(val)}
                >
                  ${val}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm">Potential Payout</span>
              <span className="text-lg font-bold text-primary">{formatUSD(potentialPayout)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            {!isConnected ? (
              <Button className="flex-1" disabled>
                Connect Wallet
              </Button>
            ) : (
              <Button 
                className="flex-1" 
                onClick={handlePurchase}
                disabled={isLoading || parseFloat(amount) > parseFloat(balance)}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Purchasing...
                  </>
                ) : isApproveSuccess ? (
                  'Confirm Purchase'
                ) : (
                  'Buy Insurance'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InsuranceProducts() {
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getInsuranceProducts();
        if (response.success && response.data) {
          // Map API data to component format
          const mappedProducts: InsuranceProduct[] = response.data.map((product: ApiInsuranceProduct, index: number) => {
            // Calculate risk level based on odds
            const avgOdds = (product.currentOdds.rug + product.currentOdds.safe) / 2;
            let riskLevel: 'low' | 'medium' | 'high' = 'medium';
            if (avgOdds < 1.5) riskLevel = 'high';
            else if (avgOdds > 2.5) riskLevel = 'low';

            // Calculate expires in
            const expiresAt = product.expiresAt || Date.now() + 86400000; // Default 24h
            const expiresInMs = expiresAt - Date.now();
            const expiresInHours = Math.floor(expiresInMs / 3600000);
            const expiresIn = expiresInHours > 0 ? `${expiresInHours}h` : '<1h';

            return {
              id: product.id || `product-${index}`,
              tokenName: product.tokenName || 'Unknown Token',
              tokenSymbol: product.tokenSymbol || 'UNK',
              chain: product.chain || 'base',
              address: product.tokenAddress || '',
              premiumRate: product.premiumRate || 5,
              poolSize: parseFloat(product.poolSize || '0'),
              currentOdds: {
                rug: parseFloat(product.currentOdds?.rug?.toString() || '2.0'),
                safe: parseFloat(product.currentOdds?.safe?.toString() || '2.0'),
              },
              expiresIn,
              riskLevel,
              poolId: index + 1, // Use index as poolId for now
              expiresAt,
            };
          });

          // Add PopCow special products at the beginning
          const popCowProducts: InsuranceProduct[] = [
            {
              id: 'popcow-special',
              tokenName: 'PopCow Alpha Protection Bundle',
              tokenSymbol: 'COWGUARD',
              chain: 'multi-chain',
              address: 'PopCow...Protected',
              premiumRate: 2, // Even lower premium for PopCow users
              poolSize: 100000,
              currentOdds: { rug: 1.5, safe: 3.0 },
              expiresIn: '30d',
              riskLevel: 'low',
              poolId: 999,
              expiresAt: Date.now() + 2592000000, // 30 days
            }
          ];

          setProducts([...popCowProducts, ...mappedProducts]);
        } else {
          setError(response.error || 'Failed to load insurance products');
        }
      } catch (err) {
        console.error('Error fetching insurance products:', err);
        setError('Failed to load insurance products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading insurance products...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No insurance products available at the moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Available Insurance Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50 ${
                product.id === 'popcow-special' 
                  ? 'border-orange-500 bg-gradient-to-r from-orange-50/50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                  product.id === 'popcow-special'
                    ? 'bg-orange-500 text-white'
                    : 'bg-primary/10'
                }`}>
                  {product.id === 'popcow-special' ? '🐄' : product.tokenSymbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.tokenName}</span>
                    {product.id === 'popcow-special' && (
                      <Badge className="bg-orange-500 hover:bg-orange-600">PopCow 专属</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      ${product.tokenSymbol}
                    </span>
                    <Badge variant="outline">{product.chain}</Badge>
                    {getRiskBadge(product.riskLevel)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.id === 'popcow-special' 
                      ? '🐄 PopCow\'s premium protection package - Maximum coverage, minimum risk' 
                      : formatAddress(product.address)
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Premium Rate</p>
                  <p className="font-bold">{product.premiumRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pool Size</p>
                  <p className="font-bold">{formatUSD(product.poolSize)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Rug Odds
                  </p>
                  <p className="font-bold text-destructive">{product.currentOdds.rug}x</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expires
                  </p>
                  <p className="font-bold">{product.expiresIn}</p>
                </div>
                  <Button onClick={() => setSelectedProduct(product)}>Buy Coverage</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

      <BuyModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
