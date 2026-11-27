import type { Metadata } from 'next';
import ToolPage from '@/components/discovery/ToolPage';
import { LandCalculator } from '@/components/discovery/PropertyCalculators';

export const metadata: Metadata = {title:"Land area converter",description:"Convert between the land area units used in Sri Lankan property listings and metric measurements.",alternates:{canonical:'/tools/land-converter'}};
export default function Page(){return <ToolPage slug="land-converter" title="Land area converter" description="Convert between the land area units used in Sri Lankan property listings and metric measurements."><LandCalculator/></ToolPage>;}
