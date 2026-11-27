import type { Metadata } from 'next';
import Header from '@/components/ui/layout/Header';
import LivingCostCalculator from '@/components/discovery/LivingCostCalculator';

export const metadata: Metadata = {
  title: 'Monthly living cost calculator',
  description: 'Estimate your monthly cost of living in Sri Lanka using your own expenses in LKR.',
  alternates: { canonical: '/tools/living-cost' },
};

export default function LivingCostPage() {
  return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]">
    <Header />
    <main className="mx-auto max-w-5xl px-5 py-14">
      <p className="text-xs font-semibold uppercase tracking-widest">Avara Intelligence / Tools</p>
      <h1 className="mt-4 font-serif text-5xl">The real cost of living.</h1>
      <p className="mt-4 max-w-2xl text-slate-700">Enter monthly amounts in Sri Lankan rupees. This is your personal scenario, not an estimate of neighbourhood market prices.</p>
      <LivingCostCalculator />
    </main>
  </div>;
}
