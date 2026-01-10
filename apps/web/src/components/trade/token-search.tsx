'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TokenSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-64 justify-start text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search tokens...
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border bg-card shadow-lg">
            <div className="flex items-center border-b p-4">
              <Search className="mr-2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by token name, symbol, or address..."
                className="flex-1 bg-transparent outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {query.length > 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching for &quot;{query}&quot;...
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="px-2 text-xs font-medium text-muted-foreground">
                    TRENDING
                  </p>
                  {['PEPE', 'WOJAK', 'BONK', 'DOGE2'].map((token) => (
                    <button
                      key={token}
                      className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-secondary"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                        {token.charAt(0)}
                      </div>
                      <span className="font-medium">${token}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
