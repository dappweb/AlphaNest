'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VaultType, useYieldVault } from '@/hooks/use-yield-vault';
import { useWallet } from '@solana/wallet-adapter-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VaultCardProps {
  vaultType: VaultType;
  title: string;
  description: string;
  apy: number;
  lockPeriod: number;
  minDeposit: number;
}

export function VaultCard({
  vaultType,
  title,
  description,
  apy,
  lockPeriod,
  minDeposit,
}: VaultCardProps) {
  const { publicKey } = useWallet();
  const { deposit, withdraw, claimEarnings, userPosition, isLoading } = useYieldVault();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const handleDeposit = async () => {
    if (!publicKey) return;
    try {
      const amount = parseFloat(depositAmount);
      if (amount < minDeposit) {
        alert(`Minimum deposit is ${minDeposit}`);
        return;
      }
      await deposit(vaultType, amount);
      setIsDepositOpen(false);
      setDepositAmount('');
    } catch (error: any) {
      alert(`Deposit failed: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey) return;
    try {
      const amount = parseFloat(withdrawAmount);
      await withdraw(vaultType, amount);
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
    } catch (error: any) {
      alert(`Withdraw failed: ${error.message}`);
    }
  };

  const handleClaimEarnings = async () => {
    if (!publicKey) return;
    try {
      await claimEarnings(vaultType);
    } catch (error: any) {
      alert(`Claim failed: ${error.message}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant={vaultType === VaultType.Aggressive ? 'destructive' : 'default'}>
            {apy}% APY
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">锁定期</p>
              <p className="font-semibold">
                {lockPeriod === 0 ? '无' : `${lockPeriod} 天`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">最低存款</p>
              <p className="font-semibold">{minDeposit} USDC</p>
            </div>
          </div>

          {userPosition && userPosition.depositedAmount > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">已存款</span>
                <span className="font-semibold">
                  {userPosition.depositedAmount.toLocaleString()} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">已赚取</span>
                <span className="font-semibold text-green-600">
                  {userPosition.earnedAmount.toLocaleString()} USDC
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1" disabled={!publicKey || isLoading}>
                  存款
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>存款到 {title}</DialogTitle>
                  <DialogDescription>
                    最低存款: {minDeposit} USDC
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deposit-amount">存款金额 (USDC)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      min={minDeposit}
                    />
                  </div>
                  <Button onClick={handleDeposit} className="w-full" disabled={isLoading}>
                    {isLoading ? '处理中...' : '确认存款'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {userPosition && userPosition.depositedAmount > 0 && (
              <>
                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={isLoading}>
                      提取
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>从 {title} 提取</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="withdraw-amount">提取金额 (USDC)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          max={userPosition.depositedAmount}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          可提取: {userPosition.depositedAmount.toLocaleString()} USDC
                        </p>
                      </div>
                      <Button onClick={handleWithdraw} className="w-full" disabled={isLoading}>
                        {isLoading ? '处理中...' : '确认提取'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {userPosition.earnedAmount > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleClaimEarnings}
                    disabled={isLoading}
                  >
                    领取收益
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
