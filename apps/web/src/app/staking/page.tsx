'use client';

import { useState } from 'react';
// 项目仅支持 Solana/pump.fun，已移除 wagmi
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Coins, 
  ExternalLink,
  Shield,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  Sparkles,
  Lock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
// 项目仅支持 Solana，已移除 BSC 相关 hooks
import {
  useSolanaStaking,
  LockPeriod as SolanaLockPeriod,
  LOCK_PERIOD_LABELS as SOLANA_LOCK_LABELS,
} from '@/hooks/use-solana-staking';
import { useActiveChain, type ChainType } from '@/components/ui/chain-switcher';
import { useStakingReferral, DEFAULT_REFERRER } from '@/hooks/use-staking-referral';
import { Gift, UserPlus } from 'lucide-react';

export default function StakingPage() {
  // 项目仅支持 Solana/pump.fun
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const { t } = useTranslation();
  const { activeChain, setActiveChain, isSolana } = useActiveChain();
  
  // 推荐系统 - 新用户必须绑定推荐人
  const {
    hasReferrer,
    needsReferrer,
    autoBindReferrer,
    bindToDefaultReferrer,
    isBindingReferrer,
    bindSuccess,
    getReferrerFromUrl,
    inviteeBonus,
  } = useStakingReferral();
  
  // 显示推荐人绑定提示
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Solana 质押 hooks
  const solanaStaking = useSolanaStaking();
  const [solanaStakeAmount, setSolanaStakeAmount] = useState('');
  const [solanaLockPeriod, setSolanaLockPeriod] = useState<SolanaLockPeriod>(SolanaLockPeriod.Flexible);
  const [activeTab, setActiveTab] = useState('stake');

  const handleSolanaStake = async () => {
    if (!solanaConnected) {
      alert('Please connect your Solana wallet first');
      return;
    }
    
    if (!solanaStakeAmount || Number(solanaStakeAmount) <= 0) {
      alert('Please enter a valid stake amount');
      return;
    }
    
    // 检查是否需要绑定推荐人（新用户必须绑定）
    if (needsReferrer) {
      setShowReferralModal(true);
      return;
    }
    
    try {
      await solanaStaking.stakeSol.stakeSol(Number(solanaStakeAmount), solanaLockPeriod);
      setSolanaStakeAmount('');
      setTimeout(() => solanaStaking.refetch(), 2000);
    } catch (error) {
      console.error('Solana stake failed:', error);
      alert(`Staking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSolanaUnstake = async () => {
    if (!solanaConnected) {
      alert('Please connect your Solana wallet first');
      return;
    }
    
    try {
      // unstake 需要传入金额（USD），使用总质押价值
      const amountUsd = solanaStaking.totalStakedValueUsd || 0;
      if (amountUsd <= 0) {
        alert('No staked amount to unstake');
        return;
      }
      await solanaStaking.unstake.unstake(amountUsd);
      setTimeout(() => solanaStaking.refetch(), 2000);
    } catch (error) {
      console.error('Solana unstake failed:', error);
      alert(`Unstaking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSolanaClaim = async () => {
    if (!solanaConnected) {
      alert('Please connect your Solana wallet first');
      return;
    }
    
    try {
      const pendingRewards = solanaStaking.stakeInfo?.pendingRewards || 0;
      if (pendingRewards <= 0) {
        alert('No rewards to claim');
        return;
      }
      await solanaStaking.claimRewards.claimRewards();
      setTimeout(() => solanaStaking.refetch(), 2000);
    } catch (error) {
      console.error('Solana claim failed:', error);
      alert(`Claim failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 处理推荐人绑定后继续质押
  const handleBindAndStake = async () => {
    try {
      await autoBindReferrer();
      setShowReferralModal(false);
      // 绑定成功后自动执行质押
      setTimeout(async () => {
        await solanaStaking.stakeSol.stakeSol(Number(solanaStakeAmount), solanaLockPeriod);
        setSolanaStakeAmount('');
        setTimeout(() => solanaStaking.refetch(), 2000);
      }, 2000);
    } catch (error) {
      console.error('Bind referrer failed:', error);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Coins className="h-6 w-6 md:h-7 md:w-7 text-purple-500" />
          {t.staking.title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Solana (pump.fun) Staking
        </p>
      </div>

      {/* Network Alert - Solana */}
      {!solanaConnected && (
        <Alert className="bg-purple-500/10 border-purple-500/30">
          <AlertCircle className="h-4 w-4 text-purple-500" />
          <AlertDescription className="text-sm">
            Please connect your Solana wallet (Phantom/Solflare) to use staking features
          </AlertDescription>
        </Alert>
      )}

      {/* 徽章区域 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 text-[10px] md:text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Solana Network
        </Badge>
        {solanaStaking.earlyBirdBonus > 0 && (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-[10px] md:text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            +{solanaStaking.earlyBirdBonus}% Bonus
          </Badge>
        )}
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px] md:text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Pyth Oracle
        </Badge>
      </div>

      {/* ============================================ */}
      {/* ============================================ */}
      {/* Solana 质押内容 - 仅支持 Solana/pump.fun */}
      {/* ============================================ */}
      {(
        <>
          {/* Solana 全局统计 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Your SOL Balance</p>
                <p className="text-lg md:text-2xl font-bold mt-1">
                  {solanaStaking.solBalance?.toFixed(4) || '0'} SOL
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ≈ ${((solanaStaking.solBalance || 0) * (solanaStaking.solPrice || 0)).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium">SOL Price</p>
                  {solanaStaking.solPriceChange24h && (
                    <Badge className={`text-[8px] ${solanaStaking.solPriceChange24h >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {solanaStaking.solPriceChange24h >= 0 ? '+' : ''}{solanaStaking.solPriceChange24h.toFixed(2)}%
                    </Badge>
                  )}
                </div>
                <p className="text-lg md:text-2xl font-bold text-purple-500 mt-1">
                  ${solanaStaking.solPrice?.toFixed(2) || '150'}
                </p>
                <p className="text-[8px] text-muted-foreground mt-0.5">via Helius/Jupiter</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Your Staked</p>
                <p className="text-lg md:text-2xl font-bold mt-1">
                  ${solanaStaking.totalStakedValueUsd?.toFixed(2) || '0'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Pending Rewards</p>
                <p className="text-lg md:text-2xl font-bold text-green-500 mt-1">
                  {solanaStaking.stakeInfo?.pendingRewards?.toFixed(4) || '0'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Solana 主要内容 */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Solana 质押卡片 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Coins className="h-5 w-5 text-purple-500" />
                    Stake SOL
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Stake SOL on Solana (pump.fun) for rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* 锁定期选择 */}
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-medium">Lock Period</label>
                    <Select
                      value={solanaLockPeriod.toString()}
                      onValueChange={(v) => setSolanaLockPeriod(Number(v) as SolanaLockPeriod)}
                    >
                      <SelectTrigger className="h-10 md:h-11 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOLANA_LOCK_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-sm">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 金额输入 */}
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-medium">Amount (SOL)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={solanaStakeAmount}
                        onChange={(e) => setSolanaStakeAmount(e.target.value)}
                        className="flex-1 h-10 md:h-11 text-sm"
                        disabled={!solanaConnected}
                      />
                      <Button
                        onClick={handleSolanaStake}
                        disabled={!solanaConnected || solanaStaking.stakeSol.isPending || !solanaStakeAmount}
                        className="bg-purple-500 hover:bg-purple-600 h-10 md:h-11 px-4 md:px-6"
                      >
                        {solanaStaking.stakeSol.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Stake
                            <ArrowRight className="h-4 w-4 ml-1 hidden sm:inline" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 快捷金额 */}
                    <div className="flex gap-1.5 mt-2">
                      {['0.5', '1', '2', '5'].map((val) => (
                        <Button
                          key={val}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setSolanaStakeAmount(val)}
                          disabled={!solanaConnected}
                        >
                          {val} SOL
                        </Button>
                      ))}
                    </div>
                  </div>

                  {solanaStaking.stakeSol.isSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/30">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-sm text-green-500">
                        Stake successful! Transaction: {solanaStaking.stakeSol.txHash?.slice(0, 8)}...
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {solanaStaking.stakeSol.error && (
                    <Alert className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-sm text-red-500">
                        {solanaStaking.stakeSol.error.message || 'Staking failed. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 未连接钱包 */}
                  {!solanaConnected && (
                    <div className="text-center py-6 md:py-8 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Connect Solana wallet to start staking</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Solana 侧边信息 */}
            <div className="space-y-3 md:space-y-4">
              {/* 锁定期倍数 */}
              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-sm md:text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-purple-500" />
                    Lock Multipliers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 md:pb-4">
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    {Object.entries(SOLANA_LOCK_LABELS).map(([_, label]) => {
                      const [period, multiplier] = label.split(' (');
                      return (
                        <div key={label} className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground">{period}</span>
                          <Badge variant="outline" className="text-[10px] md:text-xs font-bold">
                            {multiplier?.replace(')', '')}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Helius API 状态 */}
              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Helius API</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 border-0 text-[8px]">
                      <CheckCircle className="h-2 w-2 mr-0.5" />
                      Connected
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-[10px] md:text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SOL Price</span>
                      <span className="font-mono">${solanaStaking.solPrice?.toFixed(2) || '150'}</span>
                    </div>
                    {solanaStaking.solPriceChange24h && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h Change</span>
                        <span className={`font-mono ${solanaStaking.solPriceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {solanaStaking.solPriceChange24h >= 0 ? '+' : ''}{solanaStaking.solPriceChange24h.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source</span>
                      <span className="font-mono">Jupiter/Pyth</span>
                    </div>
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-2">
                    Real-time prices via Helius API
                  </p>
                </CardContent>
              </Card>

              {/* pump.fun 代币列表 */}
              {solanaStaking.pumpFunTokens && solanaStaking.pumpFunTokens.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Your pump.fun Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 md:pb-4">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {solanaStaking.pumpFunTokens.slice(0, 5).map((token, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            {token.image ? (
                              <img src={token.image} alt={token.symbol} className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px]">
                                {token.symbol?.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-medium truncate max-w-[80px]">{token.symbol}</span>
                          </div>
                          {token.price && (
                            <span className="text-[10px] text-muted-foreground">
                              ${token.price.toFixed(6)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* pump.fun 信息 */}
              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">pump.fun</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-2">
                    Solana Meme Launchpad
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-[8px] border-purple-500/30">Fair Launch</Badge>
                    <Badge variant="outline" className="text-[8px] border-purple-500/30">Bonding Curve</Badge>
                    <Badge variant="outline" className="text-[8px] border-purple-500/30">SPL Token</Badge>
                  </div>
                  <Link href="https://pump.fun" target="_blank">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs border-purple-500/30 text-purple-500 hover:bg-purple-500/10">
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      Visit pump.fun
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* 合约信息 */}
              <Card className="bg-secondary/30">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <p className="text-xs md:text-sm font-medium">Program Verified</p>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-3">
                    multi-asset-staking (Solana)
                  </p>
                  <Link href="https://solscan.io" target="_blank">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      Solscan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Referrer Binding Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-500" />
              Bind Referrer
            </DialogTitle>
            <DialogDescription>
              New users need to bind a referrer to stake. You can auto-bind via referral link or manually enter referrer address.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Referrer from URL */}
            {getReferrerFromUrl() && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <AlertDescription className="text-sm">
                  Referral link detected, will auto-bind to: <span className="font-mono text-xs">{getReferrerFromUrl()?.slice(0, 8)}...{getReferrerFromUrl()?.slice(-6)}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Bonus Info */}
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <Gift className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-500">Binding Bonus</p>
                  <p className="text-muted-foreground mt-1">
                    After binding a referrer, your first stake will get an additional <span className="text-yellow-500 font-bold">+{inviteeBonus}%</span> bonus
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReferralModal(false)}
              disabled={isBindingReferrer}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBindAndStake}
              disabled={isBindingReferrer}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {isBindingReferrer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Binding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Confirm & Continue Staking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
