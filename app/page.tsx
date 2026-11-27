import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import DiscoverySearch from '@/components/discovery/DiscoverySearch';
import DiscoveryListings from '@/components/discovery/DiscoveryListings';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import ArchitectureArt from '@/components/discovery/ArchitectureArt';
import { SectionHeading, CollectionCards, AreaCards } from '@/components/discovery/EditorialCards';
import { getPublicContent } from '@/lib/discovery/repository';
export async function generateMetadata():Promise<Metadata>{const {website}=await getPublicContent();return {title:{absolute:website.seoTitle},description:website.seoDescription,alternates:{canonical:'/'}};}
export const dynamic = 'force-dynamic';
export default async function HomePage(){
 const {hero,sections,collections,neighbourhoods,website}=await getPublicContent();
 return <div className="avara-editorial min-h-screen"><Header/>
 <main id="main-content">
  <section className="avara-shell pt-7 sm:pt-10">
   <div className="avara-hero">
    <div className="avara-hero-copy">
      <div className="avara-kicker avara-kicker-light"><span className="avara-rule"/> {hero.eyebrow}</div>
      <h1 className="avara-display mt-4 sm:mt-7 text-[clamp(3.1rem,6.35vw,6.4rem)] leading-[.98] tracking-[-.045em]">{hero.title}</h1>
      <p className="mt-6 max-w-md text-[15px] leading-[1.85] text-[#43594a] sm:text-base">{hero.description}</p>
      <Link href="/explore" className="avara-hero-link mt-5 sm:mt-8">{hero.cta}<ArrowUpRight size={18}/></Link>
      <div className="mt-7 hidden items-center gap-3 sm:flex text-[10px] uppercase tracking-[.2em] text-[#53645a]"><span className="h-px w-10 bg-[#8da889]"/> Sri Lanka / Property &amp; places</div>
    </div>
    <div className="avara-hero-image">
      <ArchitectureArt kind="house" className="absolute inset-0 h-full w-full"/>
      {website.heroImage&&<img className="absolute inset-0 h-full w-full object-cover" src={website.heroImage} alt="" fetchPriority="high"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8"><div><p className="text-[10px] uppercase tracking-[.23em]">The Avara edit</p><p className="avara-display mt-1 text-2xl sm:text-3xl">A sense of place.</p></div><span className="text-right text-[10px] text-white/90">Illustrative imagery</span></div>
    </div>
   </div>
   <div className="avara-search-wrap"><DiscoverySearch/></div>
   <div className="avara-quick-links"><span className="avara-kicker">Begin with</span><Link href="/properties/rent">Rent a home</Link><Link href="/properties/buy">Homes &amp; land</Link><Link href="/properties/stays">Short stays</Link><Link href="/map">Explore by map</Link></div>
  </section>
  {sections.collections.enabled&&<section className="avara-shell avara-section"><SectionHeading eyebrow={sections.collections.eyebrow} title={sections.collections.title} href="/listings" linkLabel="All properties"/><CollectionCards items={collections}/></section>}
  {sections.listings.enabled&&<section className="avara-shell avara-section avara-top-rule"><SectionHeading eyebrow={sections.listings.eyebrow} title={sections.listings.title} href="/listings" linkLabel="Browse properties"/><div className="mt-9"><DiscoveryListings/></div></section>}
  {sections.neighbourhoods.enabled&&<section className="avara-area-band"><div className="avara-shell avara-section"><SectionHeading eyebrow={sections.neighbourhoods.eyebrow} title={sections.neighbourhoods.title} href="/explore" linkLabel="All neighbourhoods"/><p className="mt-4 max-w-xl text-sm leading-relaxed text-[#5f685e]">Get to know the questions worth asking, the routines worth considering and the places to explore before your next move.</p><AreaCards items={neighbourhoods} compact/><p className="mt-5 text-xs text-[#5f685e]">Architectural illustrations are conceptual, not photographs or maps of the neighbourhoods.</p></div></section>}
  {website.showOwnerCallout&&<section className="avara-shell py-10 sm:py-16"><div className="rounded-xl avara-soft-panel p-6 sm:p-10"><p className="avara-kicker avara-kicker-light">For property seekers and owners</p><h2 className="avara-display mt-3 text-4xl">{website.ownerTitle}</h2><p className="mt-3 max-w-xl text-sm text-[#43594a]">{website.ownerDescription}</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/listings" className="avara-hero-link">Browse properties <ArrowUpRight size={16}/></Link><Link href="/host/apply" className="avara-hero-link">List a property <ArrowUpRight size={16}/></Link></div></div></section>}
  
 </main><DiscoveryFooter/></div>;
}
