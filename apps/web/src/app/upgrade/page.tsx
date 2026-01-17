'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Shield, 
  Gift,
  Copy,
  Check,
  Loader2,
  MousePointer2,
  Coins,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SOLANA_TOKENS } from '@/config/solana';
import { cn } from '@/lib/utils';

// 代币地址
const POPCOW_ADDRESS = SOLANA_TOKENS.POPCOW;
const POPCOW_DEFI_ADDRESS = SOLANA_TOKENS.POPCOW_DEFI;

// 兑换比例: 1 POPCOW = 1 POPCOW DEFI
const EXCHANGE_RATE = 1;

// 挖矿配置
const MINING_CONFIG = {
  baseReward: 0.001, // 基础每次点击奖励
  cooldownMs: 1000, // 冷却时间 1 秒
  bonusMultiplier: 1.5, // 质押加成
  dailyLimit: 1000, // 每日限制
};

export default function UpgradePage() {
  const { connected, publicKey } = useWallet();
  const [copied, setCopied] = useState<'popcow' | 'defi' | null>(null);
  
  // 质押状态
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [popcowBalance, setPopcowBalance] = useState(10000); // 模拟余额
  const [defiBalance, setDefiBalance] = useState(0);
  
  // 挖矿状态
  const [miningRewards, setMiningRewards] = useState(0);
  const [todayMined, setTodayMined] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [canMine, setCanMine] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [lastClickTime, setLastClickTime] = useState(0);

  // 复制地址
  const copyAddress = (type: 'popcow' | 'defi', address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // 质押兑换
  const handleStake = async () => {
    if (!connected || !stakeAmount || parseFloat(stakeAmount) <= 0) return;
    
    const amount = parseFloat(stakeAmount);
    if (amount > popcowBalance) {
      alert('Insufficient POPCOW balance');
      return;
    }

    setIsStaking(true);
    
    try {
      // 模拟交易延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 更新余额
      setPopcowBalance(prev => prev - amount);
      setStakedBalance(prev => prev + amount);
      setDefiBalance(prev => prev + amount * EXCHANGE_RATE);
      setStakeAmount('');
      
      alert(`Successfully staked ${amount} POPCOW and received ${amount * EXCHANGE_RATE} POPCOW DEFI!`);
    } catch (error) {
      console.error('Stake failed:', error);
      alert('Stake failed, please try again');
    } finally {
      setIsStaking(false);
    }
  };

  // 点击挖矿
  const handleMine = useCallback(() => {
    if (!canMine || !connected) return;
    
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    
    // 计算连击加成
    let newCombo = comboMultiplier;
    if (timeSinceLastClick < 2000) {
      newCombo = Math.min(comboMultiplier + 0.1, 3); // 最大 3x 连击
    } else {
      newCombo = 1;
    }
    setComboMultiplier(newCombo);
    setLastClickTime(now);
    
    // 计算奖励
    const stakingBonus = stakedBalance > 0 ? MINING_CONFIG.bonusMultiplier : 1;
    const reward = MINING_CONFIG.baseReward * newCombo * stakingBonus;
    
    setMiningRewards(prev => prev + reward);
    setTodayMined(prev => prev + reward);
    setClickCount(prev => prev + 1);
    
    // 开始冷却
    setCanMine(false);
    setCooldown(MINING_CONFIG.cooldownMs);
    
    // 动画效果
    setIsMining(true);
    setTimeout(() => setIsMining(false), 200);
  }, [canMine, connected, lastClickTime, comboMultiplier, stakedBalance]);

  // 冷却计时器
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(prev => Math.max(0, prev - 100));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCanMine(true);
    }
  }, [cooldown]);

  // 领取挖矿奖励
  const claimRewards = async () => {
    if (miningRewards <= 0) return;
    
    setIsStaking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDefiBalance(prev => prev + miningRewards);
      setMiningRewards(0);
      alert(`Successfully claimed ${miningRewards.toFixed(4)} POPCOW DEFI!`);
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] py-16 px-4">
        {/* 背景动画 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* 代币地址显示 */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-[#1a2744]/80 backdrop-blur px-4 py-2 rounded-full border border-cyan-500/30">
              <Badge className="bg-cyan-500 text-white">POPCOW</Badge>
              <span className="text-cyan-400 font-mono text-sm truncate max-w-[200px]">
                {POPCOW_ADDRESS}
              </span>
              <button 
                onClick={() => copyAddress('popcow', POPCOW_ADDRESS)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copied === 'popcow' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-[#1a2744]/80 backdrop-blur px-4 py-2 rounded-full border border-orange-500/30">
              <Badge className="bg-orange-500 text-white">POPCOW DEFI</Badge>
              <span className="text-orange-400 font-mono text-sm truncate max-w-[200px]">
                {POPCOW_DEFI_ADDRESS}
              </span>
              <button 
                onClick={() => copyAddress('defi', POPCOW_DEFI_ADDRESS)}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                {copied === 'defi' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Popcow Defi - Stake to
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Upgrade, Click to Mine
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Stake your $POPCOW tokens, exchange for Popcow Defi app tokens, start a 
            new click-to-mine experience!
          </p>

          {/* 升级提示横幅 */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50 rounded-full px-6 py-3">
            <Badge className="bg-orange-500 text-white font-bold">UPGRADE</Badge>
            <span className="text-orange-300">
              Popcow upgrades to Popcow Defi! Stake old tokens to exchange for new app tokens
            </span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {/* 余额概览 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">POPCOW Balance</p>
                  <p className="text-2xl font-bold text-cyan-400">{popcowBalance.toLocaleString()}</p>
                </div>
                <Coins className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">POPCOW DEFI</p>
                  <p className="text-2xl font-bold text-orange-400">{defiBalance.toFixed(4)}</p>
                </div>
                <Sparkles className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-2xl font-bold text-green-400">{stakedBalance.toLocaleString()}</p>
                </div>
                <Shield className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mining Rewards</p>
                  <p className="text-2xl font-bold text-purple-400">{miningRewards.toFixed(4)}</p>
                </div>
                <Gift className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 质押兑换卡片 */}
          <Card className="border-cyan-500/30 bg-gradient-to-br from-[#0d1f3c]/50 to-[#1a2744]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <TrendingUp className="h-6 w-6" />
                Stake to Upgrade
              </CardTitle>
              <CardDescription>
                Exchange your POPCOW tokens for POPCOW DEFI at 1:1 ratio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 兑换演示 */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-2">
                    <span className="text-2xl">🐄</span>
                  </div>
                  <p className="text-sm text-cyan-400 font-medium">POPCOW</p>
                </div>
                <ArrowRight className="h-8 w-8 text-gray-400" />
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <p className="text-sm text-orange-400 font-medium">POPCOW DEFI</p>
                </div>
              </div>

              {/* 输入框 */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Amount to Stake</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="bg-[#0a1628] border-cyan-500/30 focus:border-cyan-500"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setStakeAmount(popcowBalance.toString())}
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    MAX
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available: {popcowBalance.toLocaleString()} POPCOW
                </p>
              </div>

              {/* 兑换预览 */}
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div className="p-4 bg-[#0a1628]/50 rounded-lg border border-cyan-500/20">
                  <p className="text-sm text-muted-foreground mb-1">You will receive:</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {(parseFloat(stakeAmount) * EXCHANGE_RATE).toLocaleString()} POPCOW DEFI
                  </p>
                </div>
              )}

              {/* 质押按钮 */}
              <Button
                onClick={handleStake}
                disabled={!connected || isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-6"
              >
                {isStaking ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Staking...
                  </>
                ) : !connected ? (
                  'Connect Wallet to Stake'
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Stake & Upgrade
                  </>
                )}
              </Button>

              {/* 特性列表 */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>1:1 Exchange Rate</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>No Fees</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Instant Transfer</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-green-400" />
                  <span>Mining Bonus</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 点击挖矿卡片 */}
          <Card className="border-orange-500/30 bg-gradient-to-br from-[#1a2744]/50 to-[#0d1f3c]/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <MousePointer2 className="h-6 w-6" />
                Click to Mine
              </CardTitle>
              <CardDescription>
                Click to earn POPCOW DEFI tokens! Staking gives you bonus rewards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 挖矿按钮 */}
              <div className="flex flex-col items-center py-6">
                <button
                  onClick={handleMine}
                  disabled={!canMine || !connected}
                  className={cn(
                    "relative w-40 h-40 rounded-full transition-all duration-200",
                    "bg-gradient-to-br from-orange-400 to-yellow-500",
                    "shadow-lg shadow-orange-500/30",
                    "flex items-center justify-center",
                    "hover:scale-105 active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isMining && "scale-95 shadow-orange-500/50"
                  )}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300/20 to-transparent"></div>
                  <div className="text-center">
                    <span className="text-5xl">⛏️</span>
                    <p className="text-white font-bold mt-2">
                      {canMine ? 'MINE!' : 'Wait...'}
                    </p>
                  </div>
                  
                  {/* 连击显示 */}
                  {comboMultiplier > 1 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                      {comboMultiplier.toFixed(1)}x
                    </div>
                  )}
                </button>

                {/* 冷却进度 */}
                {!canMine && (
                  <div className="w-40 mt-4">
                    <Progress 
                      value={100 - (cooldown / MINING_CONFIG.cooldownMs * 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>

              {/* 挖矿统计 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0a1628]/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Today Mined</p>
                  <p className="text-xl font-bold text-orange-400">{todayMined.toFixed(4)}</p>
                </div>
                <div className="p-4 bg-[#0a1628]/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Click Count</p>
                  <p className="text-xl font-bold text-cyan-400">{clickCount}</p>
                </div>
              </div>

              {/* 加成信息 */}
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-400">Staking Bonus</p>
                    <p className="text-xs text-muted-foreground">
                      {stakedBalance > 0 ? `${MINING_CONFIG.bonusMultiplier}x multiplier active` : 'Stake POPCOW to get 1.5x bonus'}
                    </p>
                  </div>
                  <Badge className={stakedBalance > 0 ? 'bg-green-500' : 'bg-gray-500'}>
                    {stakedBalance > 0 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* 领取奖励按钮 */}
              <Button
                onClick={claimRewards}
                disabled={miningRewards <= 0 || isStaking}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-6"
              >
                {isStaking ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Claim {miningRewards.toFixed(4)} POPCOW DEFI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 底部说明 */}
        <Card className="bg-gradient-to-r from-[#0d1f3c]/50 to-[#1a2744]/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-400" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h4 className="font-medium mb-2">Stake POPCOW</h4>
                <p className="text-sm text-muted-foreground">
                  Stake your POPCOW tokens to upgrade them to POPCOW DEFI at 1:1 ratio
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h4 className="font-medium mb-2">Click to Mine</h4>
                <p className="text-sm text-muted-foreground">
                  Click the mining button to earn POPCOW DEFI. Build combos for higher rewards!
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">3️⃣</span>
                </div>
                <h4 className="font-medium mb-2">Get Bonus</h4>
                <p className="text-sm text-muted-foreground">
                  Staking POPCOW gives you 1.5x mining bonus. More stake = More rewards!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
