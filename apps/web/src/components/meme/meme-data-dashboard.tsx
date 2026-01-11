'use client';

import { useState } from 'react';
import {
  useAggregatedMemeData,
  useTrendingTokens,
  Chain,
  DataSource,
} from '@/hooks/use-meme-data';
import { MemeTokenCard } from './meme-token-card';
import { SmartMoneyPanel } from './smart-money-panel';
import { TopTradersPanel } from './top-traders-panel';
import { NewTokensFeed } from './new-tokens-feed';
import { SourceFilter, ChainFilter } from './source-filter';
import { Loading } from '@/components/ui/loading';

export function MemeDataDashboard() {
  const [chain, setChain] = useState<Chain>('solana');
  const [source, setSource] = useState<DataSource>('all');
  const [activeTab, setActiveTab] = useState<'trending' | 'new' | 'smart-money'>('trending');
  
  const { data, loading, error } = useAggregatedMemeData(chain);
  const { tokens: trendingTokens, loading: trendingLoading } = useTrendingTokens(chain, source, 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Meme Token Data</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Aggregated from Pump.fun, GMGN, Birdeye, DexScreener
          </p>
        </div>
        
        {/* Data Sources Status */}
        {data?.sources && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Sources:</span>
            {Object.entries(data.sources).map(([name, active]) => (
              <span
                key={name}
                className={`text-xs px-2 py-1 rounded ${
                  active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'
                }`}
              >
                {name === 'pumpfun' ? 'Pump.fun' : name.charAt(0).toUpperCase() + name.slice(1)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className="text-xs text-zinc-500 block mb-2">Chain</label>
          <ChainFilter selected={chain} onChange={(c) => setChain(c as Chain)} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-2">Source</label>
          <SourceFilter selected={source} onChange={setSource} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-1">
          {[
            { id: 'trending', label: '🔥 Trending', count: trendingTokens.length },
            { id: 'new', label: '🚀 New Launches' },
            { id: 'smart-money', label: '🧠 Smart Money' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-xs bg-zinc-700 px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'trending' && (
        <div>
          {trendingLoading && trendingTokens.length === 0 ? (
            <Loading className="py-12" />
          ) : trendingTokens.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No trending tokens found for this chain/source
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingTokens.slice(0, 30).map((token, index) => (
                <MemeTokenCard
                  key={token.address}
                  token={token}
                  rank={index + 1}
                  showSource={source === 'all'}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'new' && (
        <NewTokensFeed chain={chain} />
      )}

      {activeTab === 'smart-money' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmartMoneyPanel chain={chain} />
          <TopTradersPanel chain={chain} />
        </div>
      )}

      {/* Quick Stats */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-500 text-sm">Trending Tokens</div>
            <div className="text-2xl font-bold">{data.trending.length}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-500 text-sm">New Launches</div>
            <div className="text-2xl font-bold">{data.newTokens.length}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-500 text-sm">Smart Money Trades</div>
            <div className="text-2xl font-bold">{data.smartMoney.length}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-zinc-500 text-sm">Top Traders</div>
            <div className="text-2xl font-bold">{data.topTraders.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
