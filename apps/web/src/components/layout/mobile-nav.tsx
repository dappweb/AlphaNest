'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Zap,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar-store';

const mobileNavItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Trade', href: '/trade', icon: TrendingUp },
  { name: 'Meme', href: '/meme', icon: Zap },
  { name: 'Account', href: '/account', icon: Wallet },
  { name: 'More', href: '#more', icon: MoreHorizontal, isMore: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { toggleMobileOpen } = useSidebarStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href) && item.href !== '#more';
          
          if (item.isMore) {
            return (
              <button
                key={item.name}
                onClick={toggleMobileOpen}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors',
                  'text-muted-foreground hover:text-foreground active:scale-95'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                'active:scale-95'
              )}
            >
              <div className={cn(
                'relative transition-transform duration-200',
                isActive && 'scale-110'
              )}>
                <item.icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive && "text-primary"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
