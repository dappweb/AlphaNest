'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Coins,
  Shield,
  Gift,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/use-is-admin';

const baseMobileNavItems = [
  { name: '首页', href: '/', icon: LayoutDashboard },
  { name: '质押', href: '/staking', icon: Coins, highlight: true },
  { name: '保险', href: '/insurance', icon: Shield },
  { name: '邀请', href: '/referral', icon: Gift, highlight: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isAdmin } = useIsAdmin();

  // 构建移动端导航项 - 如果是管理员则添加管理入口
  const mobileNavItems = [
    ...baseMobileNavItems,
    ...(isAdmin ? [{ name: '管理', href: '/admin', icon: Settings }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {/* Safe area padding for iPhone */}
      <div className="pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[56px] rounded-xl transition-all duration-200',
                  isActive
                    ? item.highlight
                      ? 'text-yellow-500 bg-yellow-500/10'
                      : 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                  'active:scale-95'
                )}
              >
                <div className={cn(
                  'relative transition-transform duration-200',
                  isActive && 'scale-110'
                )}>
                  <item.icon className={cn(
                    "h-5 w-5",
                    item.highlight && isActive && "text-yellow-500"
                  )} />
                  {isActive && (
                    <span className={cn(
                      "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full",
                      item.highlight ? "bg-yellow-500" : "bg-primary"
                    )} />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive && (item.highlight ? "text-yellow-500" : "text-primary")
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
