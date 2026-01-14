'use client';

import dynamic from 'next/dynamic';

// 延迟加载 PWA 组件
const InstallPrompt = dynamic(
  () => import('./install-prompt').then(mod => ({ default: mod.InstallPrompt })),
  { ssr: false }
);

const OfflineIndicator = dynamic(
  () => import('./install-prompt').then(mod => ({ default: mod.OfflineIndicator })),
  { ssr: false }
);

export function PWAComponents() {
  return (
    <>
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
}
