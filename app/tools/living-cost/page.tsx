import type { Metadata } from 'next';
import ToolPage from '@/components/discovery/ToolPage';
import LivingCostCalculator from '@/components/discovery/LivingCostCalculator';
export const metadata: Metadata = {title:'Monthly living cost calculator',description:'Estimate your monthly cost of living in Sri Lanka using your own expenses in LKR.',alternates:{canonical:'/tools/living-cost'}};
export default function LivingCostPage(){return <ToolPage slug="living-cost" title="The real cost of living." description="Enter monthly amounts in Sri Lankan rupees. This is your personal scenario, not an estimate of neighbourhood market prices."><LivingCostCalculator/></ToolPage>;}
