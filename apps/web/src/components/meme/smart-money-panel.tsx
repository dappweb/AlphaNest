'use client';

import { useGMGNData, formatPrice, formatTimeAgo } from '@/hooks/use-meme-data';
import { Loading } from '@/components/ui/loading';

interface SmartMoneyPanelProps {
  chain?: 'solana' | 'base' | 'ethereum' | 'bsc';
}

export function SmartMoneyPanel({ chain = 'solana' }: SmartMoneyPanelProps) {
  const { smartMoney, loading, error } = useGMGNData(chain);

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🧠 Smart Money Trades
        </h3>
        <Loading className="py-8" />
      </div>
    );
  }

  if (error || smartMoney.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🧠 Smart Money Trades
        </h3>
        <div className="text-center py-8 text-zinc-500">
          {error || 'No smart money data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🧠 Smart Money Trades
        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">GMGN</span>
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {smartMoney.slice(0, 20).map((trade, index) => (
          <div
            key={`${trade.txHash}-${index}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg
              ${trade.type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}
            `}>
              {trade.type === 'buy' ? '📈' : '📉'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.type.toUpperCase()}
                </span>
                <span className="font-semibold">{trade.tokenSymbol}</span>
              </div>
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="font-mono truncate max-w-[100px]">
                  {trade.wallet.slice(0, 6)}...{trade.wallet.slice(-4)}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(trade.timestamp)}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-mono text-sm">{formatPrice(trade.amountUsd)}</div>
              <div className="text-xs text-zinc-500">@ {formatPrice(trade.priceUsd)}</div>
            </div>
            
            <a
              href={`https://solscan.io/tx/${trade.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
