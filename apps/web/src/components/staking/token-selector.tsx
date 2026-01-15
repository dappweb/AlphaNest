'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAKEABLE_TOKENS } from '@/lib/solana';

interface TokenSelectorProps {
  selectedToken: typeof STAKEABLE_TOKENS[0] | null;
  onSelectToken: (token: typeof STAKEABLE_TOKENS[0]) => void;
  balances?: Record<string, number>;
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
  balances = {},
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTokens = STAKEABLE_TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
  );

  const featuredTokens = filteredTokens.filter((t) => t.featured);
  const otherTokens = filteredTokens.filter((t) => !t.featured);

  const handleSelect = (token: typeof STAKEABLE_TOKENS[0]) => {
    onSelectToken(token);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-14 px-4"
        >
          {selectedToken ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedToken.icon}</span>
              <div className="text-left">
                <p className="font-medium">{selectedToken.symbol}</p>
                <p className="text-xs text-muted-foreground">{selectedToken.name}</p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">选择质押代币</span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择质押代币</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索代币..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 推荐代币 */}
          {featuredTokens.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                <span>推荐</span>
              </div>
              <div className="space-y-1">
                {featuredTokens.map((token) => (
                  <TokenItem
                    key={token.symbol}
                    token={token}
                    balance={balances[token.symbol]}
                    isSelected={selectedToken?.symbol === token.symbol}
                    onSelect={() => handleSelect(token)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 其他代币 */}
          {otherTokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">其他代币</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {otherTokens.map((token) => (
                  <TokenItem
                    key={token.symbol}
                    token={token}
                    balance={balances[token.symbol]}
                    isSelected={selectedToken?.symbol === token.symbol}
                    onSelect={() => handleSelect(token)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTokens.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              未找到匹配的代币
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TokenItemProps {
  token: typeof STAKEABLE_TOKENS[0];
  balance?: number;
  isSelected: boolean;
  onSelect: () => void;
}

function TokenItem({ token, balance, isSelected, onSelect }: TokenItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
        isSelected
          ? 'bg-orange-500/10 border border-orange-500/50'
          : 'hover:bg-secondary border border-transparent'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{token.icon}</span>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium">{token.symbol}</span>
            {token.rewardMultiplier > 1 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/10 text-orange-500 border-orange-500/30">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                {token.rewardMultiplier}x
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {balance !== undefined ? balance.toLocaleString() : '-'}
        </p>
        <p className="text-xs text-muted-foreground">余额</p>
      </div>
    </button>
  );
}
