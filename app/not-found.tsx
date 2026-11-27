import Link from 'next/link';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import ArchitectureArt from '@/components/discovery/ArchitectureArt';
import { ArrowUpRight } from 'lucide-react';
export default function NotFound(){
 return <div className="avara-editorial min-h-screen"><Header/><main className="avara-shell avara-section">
 <div className="grid items-center gap-8 lg:grid-cols-2"><section><p className="avara-kicker">Avara / 404</p><h1 className="avara-display mt-5 text-[clamp(2.8rem,6vw,6rem)] leading-[1.04]">This place is off the map.</h1><p className="mt-6 max-w-md text-base leading-relaxed text-[#5f685e]">The page may have moved, or the property may no longer be available. There is still plenty to discover.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#243b31] px-5 text-sm font-semibold text-white">Back to Avara <ArrowUpRight size={17}/></Link><Link href="/listings" className="inline-flex min-h-[48px] items-center rounded-full border border-[#dedbd0] px-5 text-sm font-semibold">Browse properties</Link></div></section><div className="avara-art-frame"><ArchitectureArt kind="garden" className="avara-art"/></div></div>
 </main><DiscoveryFooter/></div>;
}
