'use client';

import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trade', href: '/trade', icon: TrendingUp },
  { name: 'Dev Rankings', href: '/devs', icon: Users },
  { name: 'Insurance', href: '/insurance', icon: Shield },
  { name: 'Points', href: '/points', icon: Coins },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Bots', href: '/bots', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-lg font-bold text-primary-foreground">A</span>
        </div>
        <span className="text-xl font-bold text-gradient">AlphaNest</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
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
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Network Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
