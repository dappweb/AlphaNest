'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MemeToken,
  formatPrice,
  formatMarketCap,
  formatPriceChange,
  formatTimeAgo,
  getSourceColor,
  getSourceLabel,
} from '@/hooks/use-meme-data';

interface MemeTokenCardProps {
  token: MemeToken;
  rank?: number;
  showSource?: boolean;
  compact?: boolean;
}

export function MemeTokenCard({
  token,
  rank,
  showSource = true,
  compact = false,
}: MemeTokenCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const priceChangeColor = (token.priceChange24h || 0) >= 0 
    ? 'text-green-500' 
    : 'text-red-500';

  if (compact) {
    return (
      <Link
        href={`/trade?token=${token.address}&chain=${token.chain}`}
        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
      >
        {rank && (
          <span className="text-sm text-zinc-500 font-mono w-6">#{rank}</span>
        )}
        
        <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
          {token.logo && !imageError ? (
            <Image
              src={token.logo}
              alt={token.symbol}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
              {token.symbol?.slice(0, 2)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{token.symbol}</span>
            {showSource && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getSourceColor(token.source)} text-white`}>
                {getSourceLabel(token.source)}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 truncate">{token.name}</div>
        </div>
        
        <div className="text-right">
          <div className="font-mono text-sm">{formatPrice(token.priceUsd)}</div>
          <div className={`text-xs font-mono ${priceChangeColor}`}>
            {formatPriceChange(token.priceChange24h)}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/trade?token=${token.address}&chain=${token.chain}`}
      className="block p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all border border-zinc-700/50 hover:border-zinc-600"
    >
      <div className="flex items-start gap-3 mb-3">
        {rank && (
          <span className="text-lg text-zinc-500 font-mono w-8">#{rank}</span>
        )}
        
        <div className="w-12 h-12 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
          {token.logo && !imageError ? (
            <Image
              src={token.logo}
              alt={token.symbol}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold">
              {token.symbol?.slice(0, 2)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{token.symbol}</h3>
            {showSource && (
              <span className={`text-xs px-2 py-0.5 rounded ${getSourceColor(token.source)} text-white`}>
                {getSourceLabel(token.source)}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 truncate">{token.name}</p>
          {token.createdAt && (
            <p className="text-xs text-zinc-500 mt-1">
              Created {formatTimeAgo(token.createdAt)}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-zinc-500">Price</span>
          <div className="font-mono font-medium">{formatPrice(token.priceUsd)}</div>
        </div>
        <div>
          <span className="text-zinc-500">24h</span>
          <div className={`font-mono font-medium ${priceChangeColor}`}>
            {formatPriceChange(token.priceChange24h)}
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Market Cap</span>
          <div className="font-mono">{formatMarketCap(token.marketCap || '0')}</div>
        </div>
        <div>
          <span className="text-zinc-500">Volume 24h</span>
          <div className="font-mono">{formatMarketCap(token.volume24h || '0')}</div>
        </div>
      </div>
      
      {token.txns24h && (
        <div className="mt-3 pt-3 border-t border-zinc-700/50">
          <div className="flex justify-between text-xs">
            <span className="text-green-500">
              {token.txns24h.buys} Buys
            </span>
            <span className="text-red-500">
              {token.txns24h.sells} Sells
            </span>
          </div>
        </div>
      )}
      
      {(token.twitter || token.telegram || token.website) && (
        <div className="mt-3 pt-3 border-t border-zinc-700/50 flex gap-3">
          {token.website && (
            <a
              href={token.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:text-white"
            >
              🌐 Website
            </a>
          )}
          {token.twitter && (
            <a
              href={token.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:text-white"
            >
              𝕏 Twitter
            </a>
          )}
          {token.telegram && (
            <a
              href={token.telegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✈️ Telegram
            </a>
          )}
        </div>
      )}
    </Link>
  );
}
