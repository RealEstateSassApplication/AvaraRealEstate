import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { AreaCards } from '@/components/discovery/EditorialCards';
import ArchitectureArt from '@/components/discovery/ArchitectureArt';
import { getPublicContent } from '@/lib/discovery/repository';
export const metadata: Metadata={title:'Explore neighbourhoods in Sri Lanka',description:'Discover five Colombo-area neighbourhoods with practical property viewing checklists and rental links.',alternates:{canonical:'/explore'}};
export const dynamic='force-dynamic';
export default async function ExplorePage(){
 const {neighbourhoods,directory}=await getPublicContent();
 return <div className="avara-editorial min-h-screen"><Header/><main id="main-content" className="avara-shell">
 <section className="avara-section"><div className="grid items-center gap-8 lg:grid-cols-[1.08fr_.92fr]"><div><p className="avara-kicker">The neighbourhood edit / Sri Lanka</p><h1 className="avara-display mt-5 text-[clamp(3rem,6vw,6rem)] leading-[1.02]">{directory.title}</h1><p className="mt-6 max-w-xl text-[15px] leading-[1.85] text-[#5f685e]">{directory.description}</p><Link href="/tools" className="avara-text-link mt-7">Plan your next move <ArrowUpRight size={17}/></Link></div><div className="avara-art-frame"><ArchitectureArt kind="city" className="avara-art"/><span className="avara-art-index">Editorial illustration</span></div></div></section>
 <section className="avara-top-rule pb-16 pt-8"><p className="avara-kicker">Explore the Colombo region</p><h2 className="avara-display mt-3 text-4xl">The places collection.</h2><AreaCards items={neighbourhoods}/><p className="mt-6 text-xs text-[#5f685e]">Conceptual architecture illustrations; not photographs of specific neighbourhoods.</p></section>
 <section className="mb-16 rounded-[1.25rem] bg-[#243b31] p-7 text-white sm:p-12"><p className="avara-kicker avara-kicker-light">Avara intelligence</p><h2 className="avara-display mt-4 text-4xl">A place that fits your budget, too.</h2><p className="mt-3 text-sm leading-relaxed text-white/85">Compare your own rent, transport and living expenses before deciding.</p><Link href="/tools/living-cost" className="avara-hero-link mt-6">Estimate living costs <ArrowUpRight size={17}/></Link></section>
 </main><DiscoveryFooter/></div>;
}
