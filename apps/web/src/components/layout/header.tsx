'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications';
import Image from 'next/image';

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Mock unread count - in production, get from API/state
  const unreadCount = 3;

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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search with PopCow intelligence... 🐄"
              className="h-10 w-64 rounded-lg border bg-secondary pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500"
            />
          </div>
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
