import type { Metadata } from 'next';
import ToolPage from '@/components/discovery/ToolPage';
import { RentBuyCalculator } from '@/components/discovery/PropertyCalculators';

export const metadata: Metadata = {title:"Rent or buy?",description:"Compare the nominal cost of renting and owning over your chosen period. Adjust every assumption; this is not a market prediction.",alternates:{canonical:'/tools/rent-vs-buy'}};
export default function Page(){return <ToolPage slug="rent-vs-buy" title="Rent or buy?" description="Compare the nominal cost of renting and owning over your chosen period. Adjust every assumption; this is not a market prediction."><RentBuyCalculator/></ToolPage>;}
