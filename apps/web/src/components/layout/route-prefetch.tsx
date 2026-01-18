'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Route prefetch component
 * Preload critical routes on pages users are likely to visit
 */
export function RoutePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    // Prefetch critical routes
    const criticalRoutes = [
      '/staking',
      '/insurance',
      '/referral',
      '/admin',
    ];

    // Prefetch related routes based on current path
    const prefetchRoutes: string[] = [];

    if (pathname === '/') {
      // Prefetch most commonly used routes on homepage
      prefetchRoutes.push(...criticalRoutes.slice(0, 3));
    } else if (pathname === '/staking') {
      prefetchRoutes.push('/insurance', '/referral');
    } else if (pathname === '/insurance') {
      prefetchRoutes.push('/staking', '/referral');
    }

    // Use Link component to prefetch (Next.js will handle automatically)
    prefetchRoutes.forEach((route) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    return () => {
      // Cleanup
      prefetchRoutes.forEach((route) => {
        const link = document.querySelector(`link[href="${route}"]`);
        if (link) {
          document.head.removeChild(link);
        }
      });
    };
  }, [pathname]);

  // Use hidden Link components to trigger prefetch
  return (
    <div className="hidden">
      {['/staking', '/insurance', '/referral', '/admin'].map((route) => (
        <Link key={route} href={route} prefetch={true} />
      ))}
    </div>
  );
}
