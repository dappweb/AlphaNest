'use client';

import { InsuranceHero } from '@/components/insurance/insurance-hero';
import { InsuranceProducts } from '@/components/insurance/insurance-products';
import { MyPolicies } from '@/components/insurance/my-policies';
import { useActiveChain } from '@/components/ui/chain-switcher';
import { Shield } from 'lucide-react';

export default function InsurancePage() {
  const { activeChain, setActiveChain, isSolana } = useActiveChain();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 md:h-7 md:w-7 text-purple-500" />
          CowGuard Insurance
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Solana (pump.fun) Meme Token Protection
        </p>
      </div>

      {/* Insurance Hero */}
      <InsuranceHero />
      
      {/* Insurance Products */}
      <InsuranceProducts />
      
      {/* My Policies */}
      <MyPolicies />
    </div>
  );
}
