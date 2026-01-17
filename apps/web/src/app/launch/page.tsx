'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Rocket, Coins, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/use-translation';
import { useSolanaTokenFactory } from '@/hooks/use-solana-token-factory';
import { cn } from '@/lib/utils';

export default function LaunchPage() {
  const { isConnected: evmConnected } = useAccount();
  const { connected: solanaConnected } = useWallet();
  const { t } = useTranslation();
  const { createToken, isLoading: isCreatingToken, error: tokenError } = useSolanaTokenFactory();
  const [step, setStep] = useState(1);
  
  const isConnected = evmConnected || solanaConnected;
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdToken, setCreatedToken] = useState<{
    address: string;
    name: string;
    symbol: string;
  } | null>(null);

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t.launch.errors.nameRequired;
    } else if (formData.name.length > 32) {
      newErrors.name = t.launch.errors.nameTooLong;
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = t.launch.errors.symbolRequired;
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = t.launch.errors.symbolTooLong;
    }

    const supply = parseFloat(formData.totalSupply);
    if (!formData.totalSupply || isNaN(supply) || supply <= 0) {
      newErrors.totalSupply = t.launch.errors.supplyRequired;
    } else if (supply < 1_000_000) {
      newErrors.totalSupply = t.launch.errors.supplyTooLow;
    } else if (supply > 1_000_000_000_000) {
      newErrors.totalSupply = t.launch.errors.supplyTooHigh;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 计算费用
  const calculateFee = () => {
    // 基础费用 0.01 ETH
    const baseFee = 0.01;
    // TODO: 检查是否为认证 Dev，应用折扣
    return baseFee;
  };

  // 创建代币
  const handleCreateToken = async () => {
    if (!validateForm()) return;
    if (!isConnected) {
      alert(t.launch.errors.walletNotConnected);
      return;
    }

    try {
      const result = await createToken({
        name: formData.name,
        symbol: formData.symbol,
        totalSupply: parseFloat(formData.totalSupply),
        decimals: 9,
        description: formData.description,
        website: formData.website,
        twitter: formData.twitter,
        telegram: formData.telegram,
      });

      setCreatedToken({
        address: result.mint,
        name: formData.name,
        symbol: formData.symbol,
      });
      setStep(3);
    } catch (error: any) {
      console.error('Create token failed:', error);
      alert(error.message || t.launch.errors.createFailed);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-8 w-8 text-orange-500" />
            {t.launch.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.launch.subtitle}
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
          <Coins className="h-3 w-3 mr-1" />
          {t.launch.fee}: {calculateFee()} ETH
        </Badge>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors',
                step >= s
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  'w-16 h-1 transition-colors',
                  step > s ? 'bg-orange-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Token Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.launch.step1.title}</CardTitle>
            <CardDescription>{t.launch.step1.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.launch.step1.name} *</Label>
              <Input
                id="name"
                placeholder={t.launch.step1.namePlaceholder}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t.launch.step1.nameHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">{t.launch.step1.symbol} *</Label>
              <Input
                id="symbol"
                placeholder={t.launch.step1.symbolPlaceholder}
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                className={errors.symbol ? 'border-destructive' : ''}
                maxLength={10}
              />
              {errors.symbol && (
                <p className="text-sm text-destructive">{errors.symbol}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t.launch.step1.symbolHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSupply">{t.launch.step1.totalSupply} *</Label>
              <Input
                id="totalSupply"
                type="number"
                placeholder={t.launch.step1.totalSupplyPlaceholder}
                value={formData.totalSupply}
                onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                className={errors.totalSupply ? 'border-destructive' : ''}
              />
              {errors.totalSupply && (
                <p className="text-sm text-destructive">{errors.totalSupply}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t.launch.step1.totalSupplyHint}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} disabled={!validateForm()}>
                {t.common.next}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Additional Information */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.launch.step2.title}</CardTitle>
            <CardDescription>{t.launch.step2.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t.launch.step2.description}</Label>
              <textarea
                id="description"
                placeholder={t.launch.step2.descriptionPlaceholder}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">{t.launch.step2.website}</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">{t.launch.step2.twitter}</Label>
                <Input
                  id="twitter"
                  placeholder="@username"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">{t.launch.step2.telegram}</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/..."
                value={formData.telegram}
                onChange={(e) => handleInputChange('telegram', e.target.value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t.launch.step2.warning.title}</AlertTitle>
              <AlertDescription>
                {t.launch.step2.warning.description}
              </AlertDescription>
            </Alert>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t.common.back}
              </Button>
              <Button
                onClick={handleCreateToken}
                disabled={isCreatingToken || !isConnected}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isCreatingToken ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.launch.creating}
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    {t.launch.createToken}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && createdToken && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              {t.launch.step3.title}
            </CardTitle>
            <CardDescription>{t.launch.step3.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">{t.launch.step3.success}</AlertTitle>
              <AlertDescription>
                {t.launch.step3.successDescription}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 rounded-lg bg-secondary">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.launch.step3.tokenName}</span>
                <span className="font-medium">{createdToken.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.launch.step3.tokenSymbol}</span>
                <span className="font-medium">{createdToken.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.launch.step3.tokenAddress}</span>
                <span className="font-mono text-sm">{createdToken.address}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(createdToken.address);
                  alert(t.launch.step3.copied);
                }}
              >
                {t.launch.step3.copyAddress}
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  setStep(1);
                  setFormData({
                    name: '',
                    symbol: '',
                    totalSupply: '',
                    description: '',
                    website: '',
                    twitter: '',
                    telegram: '',
                  });
                  setCreatedToken(null);
                }}
              >
                {t.launch.step3.createAnother}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Not Connected */}
      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.launch.walletRequired.title}</AlertTitle>
          <AlertDescription>
            {t.launch.walletRequired.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
