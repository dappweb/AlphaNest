'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * 路由预取组件
 * 在用户可能访问的页面上预加载关键路由
 */
export function RoutePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    // 预取关键路由
    const criticalRoutes = [
      '/staking',
      '/trade',
      '/meme',
      '/points',
      '/referral',
    ];

    // 根据当前路径预取相关路由
    const prefetchRoutes: string[] = [];

    if (pathname === '/') {
      // 在首页预取最常用的路由
      prefetchRoutes.push(...criticalRoutes.slice(0, 3));
    } else if (pathname === '/staking') {
      prefetchRoutes.push('/trade', '/points');
    } else if (pathname === '/trade') {
      prefetchRoutes.push('/meme', '/tools/security-score');
    }

    // 使用 Link 组件预取（Next.js 会自动处理）
    prefetchRoutes.forEach((route) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    return () => {
      // 清理
      prefetchRoutes.forEach((route) => {
        const link = document.querySelector(`link[href="${route}"]`);
        if (link) {
          document.head.removeChild(link);
        }
      });
    };
  }, [pathname]);

  // 使用隐藏的 Link 组件触发预取
  return (
    <div className="hidden">
      {['/staking', '/trade', '/meme', '/points', '/referral'].map((route) => (
        <Link key={route} href={route} prefetch={true} />
      ))}
    </div>
  );
}
