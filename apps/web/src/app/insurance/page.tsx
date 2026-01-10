import { InsuranceHero } from '@/components/insurance/insurance-hero';
import { InsuranceProducts } from '@/components/insurance/insurance-products';
import { MyPolicies } from '@/components/insurance/my-policies';

export default function InsurancePage() {
  return (
    <div className="space-y-6">
      <InsuranceHero />
      <InsuranceProducts />
      <MyPolicies />
    </div>
  );
}
