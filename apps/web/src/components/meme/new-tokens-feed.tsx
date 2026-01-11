'use client';

import { useState, useEffect } from 'react';
import { useNewTokens, MemeToken, formatPrice, formatTimeAgo, getSourceColor, getSourceLabel } from '@/hooks/use-meme-data';
import { MemeTokenCard } from './meme-token-card';
import { SourceFilter } from './source-filter';
import { Loading } from '@/components/ui/loading';

interface NewTokensFeedProps {
  chain?: 'solana' | 'base' | 'ethereum' | 'bsc';
  autoRefresh?: boolean;
}

export function NewTokensFeed({ chain = 'solana', autoRefresh = true }: NewTokensFeedProps) {
  const [source, setSource] = useState<'all' | 'pumpfun' | 'gmgn' | 'birdeye' | 'dexscreener'>('all');
  const { tokens, loading, error, refetch } = useNewTokens(chain, source, 50);
  const [newTokenIds, setNewTokenIds] = useState<Set<string>>(new Set());

  // 检测新代币
  useEffect(() => {
    if (tokens.length > 0) {
      const currentIds = new Set(tokens.map(t => t.address));
      
      // 找出新出现的代币
      const newOnes = tokens
        .filter(t => !newTokenIds.has(t.address))
        .map(t => t.address);
      
      if (newOnes.length > 0 && newTokenIds.size > 0) {
        // 播放提示音或显示通知
        console.log('New tokens detected:', newOnes.length);
      }
      
      setNewTokenIds(currentIds);
    }
  }, [tokens]);

  if (loading && tokens.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🚀 New Token Launches
        </h3>
        <Loading className="py-8" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🚀 New Token Launches
          {loading && <span className="animate-pulse">⏳</span>}
        </h3>
        <button
          onClick={refetch}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      
      <div className="mb-4">
        <SourceFilter selected={source} onChange={setSource} />
      </div>
      
      {error && tokens.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          {error}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          No new tokens found
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {tokens.map((token, index) => (
            <NewTokenRow 
              key={token.address} 
              token={token} 
              isNew={!newTokenIds.has(token.address)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewTokenRow({ token, isNew }: { token: MemeToken; isNew?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg transition-colors
      ${isNew ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800/50 hover:bg-zinc-800'}
    `}>
      <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {token.logo ? (
          <img
            src={token.logo}
            alt={token.symbol}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-sm font-bold">{token.symbol?.slice(0, 2)}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{token.symbol}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getSourceColor(token.source)} text-white`}>
            {getSourceLabel(token.source)}
          </span>
          {isNew && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white animate-pulse">
              NEW
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500 truncate">{token.name}</div>
      </div>
      
      <div className="text-right text-sm">
        <div className="font-mono">{formatPrice(token.priceUsd)}</div>
        {token.createdAt && (
          <div className="text-xs text-zinc-500">{formatTimeAgo(token.createdAt)}</div>
        )}
      </div>
      
      <a
        href={`/trade?token=${token.address}&chain=${token.chain}`}
        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
      >
        Trade
      </a>
    </div>
  );
}
