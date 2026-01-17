'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  ArrowRight, 
  MousePointer2,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { SOLANA_TOKENS } from '@/config/solana';

const POPCOW_ADDRESS = SOLANA_TOKENS.POPCOW;
const POPCOW_DEFI_ADDRESS = SOLANA_TOKENS.POPCOW_DEFI;

export function UpgradeBanner() {
  const [copied, setCopied] = useState<'popcow' | 'defi' | null>(null);

  const copyAddress = (type: 'popcow' | 'defi', address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0a1628] via-[#0d1f3c] to-[#1a2744] p-6 text-white shadow-lg border border-cyan-500/30">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-orange-500/10 blur-3xl" />
      
      <div className="relative">
        {/* 代币地址 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-[#1a2744]/80 backdrop-blur px-3 py-1.5 rounded-full border border-cyan-500/30">
            <Badge className="bg-cyan-500 text-white text-xs">POPCOW</Badge>
            <span className="text-cyan-400 font-mono text-xs truncate max-w-[120px] sm:max-w-[180px]">
              {POPCOW_ADDRESS}
            </span>
            <button 
              onClick={() => copyAddress('popcow', POPCOW_ADDRESS)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copied === 'popcow' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 bg-[#1a2744]/80 backdrop-blur px-3 py-1.5 rounded-full border border-orange-500/30">
            <Badge className="bg-orange-500 text-white text-xs">POPCOW DEFI</Badge>
            <span className="text-orange-400 font-mono text-xs truncate max-w-[120px] sm:max-w-[180px]">
              {POPCOW_DEFI_ADDRESS}
            </span>
            <button 
              onClick={() => copyAddress('defi', POPCOW_DEFI_ADDRESS)}
              className="text-orange-400 hover:text-orange-300 transition-colors"
            >
              {copied === 'defi' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* 主标题 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Popcow Defi - Stake to Upgrade, Click to Mine
            </span>
          </h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            Stake your $POPCOW tokens, exchange for Popcow Defi app tokens, start a 
            new click-to-mine experience!
          </p>
        </div>

        {/* 升级提示 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50 rounded-full px-4 py-2">
            <Badge className="bg-orange-500 text-white font-bold text-xs">UPGRADE</Badge>
            <span className="text-orange-300 text-sm">
              Popcow upgrades to Popcow Defi! Stake old tokens to exchange for new app tokens
            </span>
          </div>
        </div>

        {/* 特性卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a1628]/50 rounded-lg p-3 text-center border border-cyan-500/20">
            <div className="text-2xl mb-1">🔄</div>
            <p className="text-xs text-gray-400">1:1 Exchange</p>
          </div>
          <div className="bg-[#0a1628]/50 rounded-lg p-3 text-center border border-orange-500/20">
            <div className="text-2xl mb-1">⛏️</div>
            <p className="text-xs text-gray-400">Click to Mine</p>
          </div>
          <div className="bg-[#0a1628]/50 rounded-lg p-3 text-center border border-green-500/20">
            <div className="text-2xl mb-1">🚀</div>
            <p className="text-xs text-gray-400">1.5x Bonus</p>
          </div>
          <div className="bg-[#0a1628]/50 rounded-lg p-3 text-center border border-purple-500/20">
            <div className="text-2xl mb-1">🎁</div>
            <p className="text-xs text-gray-400">Daily Rewards</p>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/upgrade">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/25 w-full sm:w-auto"
            >
              <Zap className="h-4 w-4 mr-2" />
              Stake & Upgrade
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/upgrade">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold shadow-lg shadow-orange-500/25 w-full sm:w-auto"
            >
              <MousePointer2 className="h-4 w-4 mr-2" />
              Click to Mine
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
