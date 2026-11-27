import type { Metadata } from 'next';
import ToolPage from '@/components/discovery/ToolPage';
import { MortgageCalculator } from '@/components/discovery/PropertyCalculators';

export const metadata: Metadata = {title:"Mortgage calculator",description:"Estimate fixed-rate mortgage payments in LKR using your own illustrative loan assumptions.",alternates:{canonical:'/tools/mortgage'}};
export default function Page(){return <ToolPage slug="mortgage" title="Mortgage calculator" description="Estimate fixed-rate mortgage payments in LKR using your own illustrative loan assumptions."><MortgageCalculator/></ToolPage>;}
