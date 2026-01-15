'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebarStore, useSidebarHydration } from '@/stores/sidebar-store';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: LayoutDashboard,
    description: '平台概览与实时数据统计',
    shortcut: 'Ctrl+D',
    badge: null
  },
  { 
    name: 'PopCow Alpha 🐄', 
    href: '/popcow', 
    icon: Rocket, 
    special: true,
    description: 'AI 驱动的 Alpha 项目发现',
    shortcut: 'Ctrl+P',
    badge: null
  },
  { 
    name: 'Trade', 
    href: '/trade', 
    icon: TrendingUp,
    description: '智能交易界面与 K 线图表',
    shortcut: 'Ctrl+T',
    badge: null
  },
  { 
    name: 'Meme Hunter', 
    href: '/meme', 
    icon: Zap,
    description: '聚合多平台热门 Meme 代币数据',
    shortcut: 'Ctrl+M',
    badge: { text: 'HOT', variant: 'default' as const }
  },
  { 
    name: 'Copy Trading', 
    href: '/copy-trading', 
    icon: Copy,
    description: '跟随顶级交易员自动跟单',
    shortcut: 'Ctrl+C',
    badge: null
  },
  { 
    name: 'Dev Rankings', 
    href: '/devs', 
    icon: Users,
    description: '开发者信誉评分与排行榜',
    shortcut: 'Ctrl+R',
    badge: null
  },
  { 
    name: 'CowGuard Insurance', 
    href: '/insurance', 
    icon: Shield,
    description: '参数化保险保护，防范 Rug Pull',
    shortcut: 'Ctrl+I',
    badge: { text: 'PRO', variant: 'secondary' as const }
  },
  { 
    name: 'Cow Points', 
    href: '/points', 
    icon: Coins,
    description: '完成任务赚取积分与奖励',
    shortcut: 'Ctrl+O',
    badge: { text: '2.5x', variant: 'outline' as const }
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3,
    description: '深度数据分析与市场洞察',
    shortcut: 'Ctrl+A',
    badge: null
  },
  { 
    name: 'Trading Bots', 
    href: '/bots', 
    icon: Bot,
    description: '自动化交易策略与机器人',
    shortcut: 'Ctrl+B',
    badge: null
  },
];

const userNavigation = [
  { 
    name: 'Account', 
    href: '/account', 
    icon: Wallet,
    description: '钱包连接与个人资料设置'
  },
  { 
    name: 'Referral', 
    href: '/referral', 
    icon: Gift,
    description: '推荐好友获得 10% 返佣奖励',
    badge: { text: '10%', variant: 'default' as const }
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: '应用偏好设置与配置'
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore();
  const hydrated = useSidebarHydration();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setMobileOpen]);

  // Use default state during SSR to avoid hydration mismatch
  const collapsed = hydrated ? isCollapsed : false;
  const mobileOpen = hydrated ? isMobileOpen : false;

  const sidebarContent = (
    <>
      <div className={cn(
        "flex h-16 items-center border-b transition-all duration-300",
        collapsed ? "justify-center px-2" : "gap-2 px-4"
      )}>
        <Image
          src="/logo.png"
          alt="PopCow Logo"
          width={32}
          height={32}
          className="rounded-lg flex-shrink-0"
        />
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
            PopCow
          </span>
        )}
      </div>

      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto transition-all duration-300",
        collapsed ? "p-2" : "p-4"
      )}>
        {/* Main Navigation */}
        <TooltipProvider delayDuration={collapsed ? 0 : 300}>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isSpecial = 'special' in item && item.special;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                        collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : isSpecial
                            ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        'hover:scale-[1.02] active:scale-[0.98]'
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant} className="text-xs">
                              {item.badge.text}
                            </Badge>
                          )}
                          {isSpecial && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              NEW
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      {item.shortcut && (
                        <p className="text-xs text-muted-foreground mt-1 opacity-70">
                          快捷键: {item.shortcut}
                        </p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Divider */}
        <div className={cn("my-4 border-t", collapsed && "mx-1")} />

        {/* User Navigation */}
        <TooltipProvider delayDuration={collapsed ? 0 : 300}>
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Account
              </p>
            )}
            {userNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                        collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        'hover:scale-[1.02] active:scale-[0.98]'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant} className="text-xs">
                              {item.badge.text}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* Collapse Toggle & Status */}
      <div className={cn("border-t transition-all duration-300", collapsed ? "p-2" : "p-4")}>
        {!collapsed && (
          <div className="rounded-lg bg-secondary p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium">All Systems Operational</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full transition-all duration-200",
            collapsed ? "p-2" : "justify-start gap-2"
          )}
          onClick={toggleCollapsed}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex sticky top-0 h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r bg-card transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-4 z-10"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        {sidebarContent}
      </aside>
    </>
  );
}
