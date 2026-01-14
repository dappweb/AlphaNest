'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
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
  Search,
  Menu,
  X,
  Zap,
  Star,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    href: '/copy-trade', 
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
        <TooltipProvider delayDuration={300}>
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
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isSpecial
                            ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge variant={item.badge.variant} className="text-xs">
                          {item.badge.text}
                        </Badge>
                      )}
                      {isSpecial && (
                        <Badge variant="destructive" className="text-xs">
                          NEW
                        </Badge>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    {item.shortcut && (
                      <p className="text-xs text-muted-foreground mt-1 opacity-70">
                        快捷键: {item.shortcut}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Divider */}
        <div className="my-4 border-t" />

        {/* User Navigation */}
        <TooltipProvider delayDuration={300}>
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Account
            </p>
            {userNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge variant={item.badge.variant} className="text-xs">
                          {item.badge.text}
                        </Badge>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Network Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            <p>⚡ Fast response</p>
            <p>🔒 Secure connection</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
