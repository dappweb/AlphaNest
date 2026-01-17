/**
 * 链选择组件 - 支持数据展示筛选
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { chainConfigs, getAllChains, getPrimaryTradeChain } from '@/config/chains';

interface ChainFilterProps {
  selectedChains: string[];
  onChainChange: (chains: string[]) => void;
  showTradeStatus?: boolean;
}

export function ChainFilter({ 
  selectedChains, 
  onChainChange, 
  showTradeStatus = true 
}: ChainFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const allChains = getAllChains();
  const primaryChain = getPrimaryTradeChain();

  const handleChainToggle = (chainId: string) => {
    const newSelection = selectedChains.includes(chainId)
      ? selectedChains.filter(id => id !== chainId)
      : [...selectedChains, chainId];
    
    onChainChange(newSelection);
  };

  const handleSelectAll = () => {
    onChainChange(allChains.map(chain => chain.id));
  };

  const handleClearAll = () => {
    onChainChange([]);
  };

  const getSelectedChainNames = () => {
    return selectedChains.map(id => {
      const chain = allChains.find(c => c.id === id);
      return chain?.name || id;
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>
            {selectedChains.length === 0 
              ? '所有链' 
              : selectedChains.length === 1 
                ? getSelectedChainNames()[0]
                : `${selectedChains.length} 条链`
            }
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">选择区块链</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleSelectAll}>
                全选
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClearAll}>
                清空
              </Button>
            </div>
          </div>
          
          {/* 主要交易链 */}
          {primaryChain && (
            <>
              <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10">
                <input
                  type="checkbox"
                  id={primaryChain.id}
                  checked={selectedChains.includes(primaryChain.id)}
                  onChange={() => handleChainToggle(primaryChain.id)}
                  className="rounded"
                />
                <label htmlFor={primaryChain.id} className="flex items-center gap-2 flex-1 cursor-pointer">
                  <img src={primaryChain.icon} alt={primaryChain.name} className="w-4 h-4" />
                  <span className="text-sm font-medium">{primaryChain.name}</span>
                  <Badge variant="default" className="text-xs">主交易链</Badge>
                </label>
              </div>
            </>
          )}
          
          {/* 其他链 */}
          {allChains
            .filter(chain => !chain.isPrimary)
            .map(chain => (
              <div key={chain.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50">
                <input
                  type="checkbox"
                  id={chain.id}
                  checked={selectedChains.includes(chain.id)}
                  onChange={() => handleChainToggle(chain.id)}
                  className="rounded"
                />
                <label htmlFor={chain.id} className="flex items-center gap-2 flex-1 cursor-pointer">
                  <img src={chain.icon} alt={chain.name} className="w-4 h-4" />
                  <span className="text-sm">{chain.name}</span>
                  {showTradeStatus && (
                    <div className="flex items-center gap-1">
                      {chain.tradeEnabled ? (
                        <Badge variant="default" className="text-xs">交易</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">仅数据</Badge>
                      )}
                    </div>
                  )}
                </label>
              </div>
            ))}
        </div>
        
        {showTradeStatus && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-muted-foreground">
              <div className="mb-1">📊 数据展示: 所有链</div>
              <div>🔄 交易功能: 仅 Solana</div>
              <div className="mt-1 text-primary">其他链交易功能将在 Q2 2025 上线</div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 快速链选择按钮组件
export function QuickChainSelect() {
  const allChains = getAllChains();
  const primaryChain = getPrimaryTradeChain();
  
  return (
    <div className="flex items-center gap-2">
      {primaryChain && (
        <Button variant="default" size="sm" className="flex items-center gap-2">
          <img src={primaryChain.icon} alt={primaryChain.name} className="w-4 h-4" />
          {primaryChain.name}
          <Badge variant="secondary" className="text-xs">交易</Badge>
        </Button>
      )}
      
      <div className="flex items-center gap-1">
        {allChains
          .filter(chain => !chain.isPrimary)
          .map(chain => (
            <Button key={chain.id} variant="outline" size="sm" className="flex items-center gap-1">
              <img src={chain.icon} alt={chain.name} className="w-3 h-3" />
              {chain.name}
              <Badge variant="secondary" className="text-xs">数据</Badge>
            </Button>
          ))}
      </div>
    </div>
  );
}
