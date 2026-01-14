import { TokenSearch } from '@/components/trade/token-search';
import { TradePanel } from '@/components/trade/trade-panel';
import { TokenInfo } from '@/components/trade/token-info';
import { LazyTokenChart } from '@/components/trade/lazy-token-chart';

export default function TradePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trade</h1>
        <TokenSearch />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <LazyTokenChart />
          <TokenInfo />
        </div>
        <div>
          <TradePanel />
        </div>
      </div>
    </div>
  );
}
