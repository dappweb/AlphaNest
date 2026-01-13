'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Bell, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications';
import Image from 'next/image';

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock unread count - in production, get from API/state
  const unreadCount = 3;

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/analytics?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Search suggestions
  const suggestions = [
    { label: 'PEPE Token', type: 'token', href: '/trade?token=PEPE' },
    { label: 'Bitcoin Analysis', type: 'analysis', href: '/analytics?symbol=BTC' },
    { label: 'Meme Coins', type: 'category', href: '/meme' },
    { label: 'Trading Bots', type: 'feature', href: '/bots' },
  ].filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      // Escape to close notifications and suggestions
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNotificationsOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          {/* PopCow Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="PopCow Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">PopCow Platform</span>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="global-search"
              type="text"
              placeholder="Search with PopCow intelligence... 🐄 (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="h-10 w-64 rounded-lg border bg-secondary pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchQuery && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <p className="text-xs text-muted-foreground mb-2">Suggestions</p>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <a
                        key={index}
                        href={suggestion.href}
                        className="block w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="h-3 w-3 text-muted-foreground" />
                          <span>{suggestion.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {suggestion.type}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </header>

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
