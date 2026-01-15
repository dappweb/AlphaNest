'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  ArrowRight, 
  Sparkles, 
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export function StakingBanner() {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-yellow-500 p-6 text-white shadow-lg">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-yellow-300/20 blur-3xl" />
      
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* 左侧内容 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{t.staking.title}</h2>
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t.staking.earlyBird}
                </Badge>
              </div>
              <p className="text-white/80 text-sm mt-1">
                {t.staking.subtitle}
              </p>
            </div>
          </div>

          {/* 数据展示 */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70">{t.staking.maxApy}</span>
              <span className="text-lg font-bold">200%</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70">{t.staking.supportTokens}</span>
              <span className="text-lg font-bold">7+</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-white/70" />
              <span className="text-sm text-white/70">POPCOW {t.staking.rewardBonus}</span>
              <span className="text-lg font-bold">2x</span>
            </div>
          </div>
        </div>

        {/* 右侧按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/staking">
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-white/90 font-bold shadow-lg w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t.staking.stakeNow}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="https://solscan.io/token/8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump" target="_blank">
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 w-full sm:w-auto"
            >
              {t.staking.viewToken}
            </Button>
          </Link>
        </div>
      </div>

      {/* 底部代币图标 */}
      <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
        <span>{t.staking.supportedTokens}:</span>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded bg-white/10">🐄 POPCOW</span>
          <span className="px-2 py-0.5 rounded bg-white/10">◎ SOL</span>
          <span className="px-2 py-0.5 rounded bg-white/10">$ USDC</span>
          <span className="px-2 py-0.5 rounded bg-white/10">🐕 BONK</span>
          <span className="hidden sm:inline px-2 py-0.5 rounded bg-white/10">🪐 JUP</span>
          <span className="hidden sm:inline px-2 py-0.5 rounded bg-white/10">更多...</span>
        </div>
      </div>
    </div>
  );
}
