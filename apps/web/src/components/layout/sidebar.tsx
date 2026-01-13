'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Shield,
  Coins,
  Settings,
  Bot,
  BarChart3,
  Wallet,
  Copy,
  Gift,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'PopCow Alpha 🐄', href: '/popcow', icon: Rocket, special: true },
  { name: 'Trade', href: '/trade', icon: TrendingUp },
  { name: 'Meme Hunter', href: '/meme', icon: Rocket },
  { name: 'Copy Trading', href: '/copy-trade', icon: Copy },
  { name: 'Dev Rankings', href: '/devs', icon: Users },
  { name: 'CowGuard Insurance', href: '/insurance', icon: Shield },
  { name: 'Cow Points', href: '/points', icon: Coins },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Trading Bots', href: '/bots', icon: Bot },
];

const userNavigation = [
  { name: 'Account', href: '/account', icon: Wallet },
  { name: 'Referral', href: '/referral', icon: Gift },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Image
          src="/logo.png"
          alt="PopCow Logo"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">PopCow</span>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isSpecial = 'special' in item && item.special;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isSpecial
                      ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {isSpecial && <span className="ml-auto text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t" />

        {/* User Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account
          </p>
          {userNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Network Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
