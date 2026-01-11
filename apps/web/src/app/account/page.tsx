'use client';

import { WalletOverview, PortfolioHoldings, TransactionHistory } from '@/components/account';

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Manage your wallet and view your portfolio
        </p>
      </div>

      <WalletOverview />
      <PortfolioHoldings />
      <TransactionHistory />
    </div>
  );
}
