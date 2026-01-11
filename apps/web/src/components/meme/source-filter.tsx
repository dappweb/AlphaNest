'use client';

import { DataSource, getSourceColor, getSourceLabel } from '@/hooks/use-meme-data';

interface SourceFilterProps {
  selected: DataSource;
  onChange: (source: DataSource) => void;
  showAll?: boolean;
}

const SOURCES: DataSource[] = ['all', 'pumpfun', 'gmgn', 'birdeye', 'dexscreener'];

export function SourceFilter({ selected, onChange, showAll = true }: SourceFilterProps) {
  const sources = showAll ? SOURCES : SOURCES.filter(s => s !== 'all');
  
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => (
        <button
          key={source}
          onClick={() => onChange(source)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${selected === source
              ? source === 'all'
                ? 'bg-white text-black'
                : `${getSourceColor(source)} text-white`
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }
          `}
        >
          {source === 'all' ? 'All Sources' : getSourceLabel(source)}
        </button>
      ))}
    </div>
  );
}

interface ChainFilterProps {
  selected: string;
  onChange: (chain: string) => void;
}

const CHAINS = [
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'ethereum', name: 'Ethereum', icon: 'Ξ' },
  { id: 'bsc', name: 'BSC', icon: '🟡' },
];

export function ChainFilter({ selected, onChange }: ChainFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHAINS.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onChange(chain.id)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5
            ${selected === chain.id
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }
          `}
        >
          <span>{chain.icon}</span>
          <span>{chain.name}</span>
        </button>
      ))}
    </div>
  );
}
