'use client';

import { useGMGNData, formatMarketCap } from '@/hooks/use-meme-data';
import { Loading } from '@/components/ui/loading';

interface TopTradersPanelProps {
  chain?: 'solana' | 'base' | 'ethereum' | 'bsc';
}

export function TopTradersPanel({ chain = 'solana' }: TopTradersPanelProps) {
  const { topTraders, loading, error } = useGMGNData(chain);

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🏆 Top Traders
        </h3>
        <Loading className="py-8" />
      </div>
    );
  }

  if (error || topTraders.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🏆 Top Traders
        </h3>
        <div className="text-center py-8 text-zinc-500">
          {error || 'No trader data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🏆 Top Traders (7D)
        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">GMGN</span>
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {topTraders.slice(0, 20).map((trader, index) => (
          <div
            key={trader.wallet}
            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {trader.wallet.slice(0, 6)}...{trader.wallet.slice(-4)}
                </span>
                {trader.label && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                    {trader.label}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                <span>{trader.totalTrades} trades</span>
                <span>•</span>
                <span>Hold: {trader.avgHoldTime}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-mono text-sm ${parseFloat(trader.totalPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(trader.totalPnl) >= 0 ? '+' : ''}{formatMarketCap(trader.totalPnl)}
              </div>
              <div className="text-xs text-zinc-500">
                {(trader.winRate * 100).toFixed(1)}% win
              </div>
            </div>
            
            <a
              href={`https://solscan.io/account/${trader.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white"
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
