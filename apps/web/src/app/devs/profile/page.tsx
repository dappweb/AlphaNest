'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { DevProfile } from '@/components/dev/dev-profile';
import { DevStats } from '@/components/dev/dev-stats';
import { DevLaunchHistory } from '@/components/dev/dev-launch-history';

function DevProfileContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address') || '';
  
  if (!address) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No address specified</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <DevProfile address={address} />
      <DevStats address={address} />
      <DevLaunchHistory address={address} />
    </div>
  );
}

export default function DevProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DevProfileContent />
    </Suspense>
  );
}
