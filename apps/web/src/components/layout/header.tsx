'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, X, Menu, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications';
import Image from 'next/image';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useTheme } from '@/stores/theme-store';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isCollapsed, toggleMobileOpen } = useSidebarStore();
  const { t } = useTranslation();
  const { theme, cycleTheme } = useTheme();

  // Theme icon based on current theme
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

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
    { label: 'Staking', type: 'feature', href: '/staking' },
    { label: 'Insurance', type: 'feature', href: '/insurance' },
    { label: 'Referral', type: 'feature', href: '/referral' },
    { label: 'Admin', type: 'feature', href: '/admin' },
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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* PopCowDefi Logo - Show when sidebar is collapsed or on mobile */}
          <div className={cn(
            "items-center gap-2 transition-opacity duration-200",
            isCollapsed ? "hidden md:flex" : "flex md:hidden"
          )}>
            <Image
              src="/logo.png"
              alt="PopCowDefi Logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent hidden sm:inline">
              PopCowDefi
            </span>
          </div>

          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="global-search"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={cn(
                "h-10 rounded-lg border bg-background pl-10 pr-20 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary transition-all duration-200",
                "w-48 md:w-64 lg:w-80"
              )}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">K</kbd>
              </div>
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

        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => {
              const searchInput = document.getElementById('global-search');
              if (searchInput) {
                searchInput.closest('form')?.classList.remove('hidden');
                searchInput.focus();
              }
            }}
          >
            <Search className="h-5 w-5" />
          </Button>

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

          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            className="h-9 w-9"
            title={`Current theme: ${theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}`}
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>

          {/* Solana 钱包连接按钮 */}
          <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !text-primary-foreground" />
        </div>
      </header>

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
