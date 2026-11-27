import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Compass, BookOpen, Calculator, Landmark, Ruler, Scale } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import DiscoverySearch from '@/components/discovery/DiscoverySearch';
import DiscoveryListings from '@/components/discovery/DiscoveryListings';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import ArchitectureArt from '@/components/discovery/ArchitectureArt';
import { SectionHeading, CollectionCards, AreaCards } from '@/components/discovery/EditorialCards';
import { propertyOSRepository } from '@/lib/discovery/content';
import { getPublicContent } from '@/lib/discovery/repository';
import { planningTools } from '@/lib/discovery/tools';
export const metadata: Metadata = { alternates: { canonical: '/' } };
export const dynamic = 'force-dynamic';
const toolIcons=[Calculator,Landmark,Scale,Ruler];
export default async function HomePage(){
 const {hero,sections,collections,neighbourhoods}=await getPublicContent();
 return <div className="avara-editorial min-h-screen"><Header/>
 <main id="main-content">
  <section className="avara-shell pt-7 sm:pt-10">
   <div className="avara-hero">
    <div className="avara-hero-copy">
      <div className="avara-kicker avara-kicker-light"><span className="avara-rule"/> {hero.eyebrow}</div>
      <h1 className="avara-display mt-7 text-[clamp(3.1rem,6.35vw,6.4rem)] leading-[.98] tracking-[-.045em]">{hero.title}</h1>
      <p className="mt-6 max-w-md text-[15px] leading-[1.85] text-[#e1e5dc] sm:text-base">{hero.description}</p>
      <Link href="/explore" className="avara-hero-link mt-8">{hero.cta}<ArrowUpRight size={18}/></Link>
      <div className="mt-12 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-[#bfc7bb]"><span className="h-px w-10 bg-[#a99d79]"/> Sri Lanka / Property &amp; places</div>
    </div>
    <div className="avara-hero-image">
      <ArchitectureArt kind="house" className="absolute inset-0 h-full w-full"/>
      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"url('https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg')"}}/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8"><div><p className="text-[10px] uppercase tracking-[.23em]">The Avara edit</p><p className="avara-display mt-1 text-2xl sm:text-3xl">A sense of place.</p></div><span className="text-right text-[10px] text-white/90">Illustrative imagery</span></div>
    </div>
   </div>
   <div className="avara-search-wrap"><DiscoverySearch/></div>
   <div className="avara-quick-links"><span className="avara-kicker">Begin with</span><Link href="/listings?purpose=rent">Long-term rentals</Link><Link href="/listings?purpose=sale">Homes &amp; land</Link><Link href="/listings?purpose=booking">Short stays</Link><Link href="/tools">Planning tools</Link></div>
  </section>
  {sections.collections.enabled&&<section className="avara-shell avara-section"><SectionHeading eyebrow={sections.collections.eyebrow} title={sections.collections.title} href="/listings" linkLabel="All properties"/><CollectionCards items={collections}/></section>}
  {sections.listings.enabled&&<section className="avara-shell avara-section avara-top-rule"><SectionHeading eyebrow={sections.listings.eyebrow} title={sections.listings.title} href="/listings" linkLabel="Browse properties"/><div className="mt-9"><DiscoveryListings/></div></section>}
  {sections.neighbourhoods.enabled&&<section className="avara-area-band"><div className="avara-shell avara-section"><SectionHeading eyebrow={sections.neighbourhoods.eyebrow} title={sections.neighbourhoods.title} href="/explore" linkLabel="All neighbourhoods"/><p className="mt-4 max-w-xl text-sm leading-relaxed text-[#5f685e]">Get to know the questions worth asking, the routines worth considering and the places to explore before your next move.</p><AreaCards items={neighbourhoods} compact/><p className="mt-5 text-xs text-[#5f685e]">Architectural illustrations are conceptual, not photographs or maps of the neighbourhoods.</p></div></section>}
  {sections.tools.enabled&&<section className="avara-shell avara-section"><SectionHeading eyebrow={sections.tools.eyebrow} title={sections.tools.title} href="/tools" linkLabel="All planning tools"/>
   <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{planningTools.map((t,i)=>{const Icon=toolIcons[i];return <Link key={t.slug} href={'/tools/'+t.slug} className="avara-tool-card group"><div className="flex items-center justify-between"><span className="avara-icon-tile"><Icon size={22} strokeWidth={1.5}/></span><ArrowUpRight size={18}/></div><p className="avara-kicker mt-8">{t.label}</p><h3 className="avara-display mt-2 text-2xl">{t.title}</h3><p className="mt-3 text-sm leading-relaxed text-[#5f685e]">{t.description}</p></Link>})}</div>
   <div className="mt-5 grid gap-4 sm:grid-cols-2"><Link className="avara-inline-card" href="/explore"><Compass size={22}/><span><strong>Neighbourhood checklists</strong><small>Prepare for your next property viewing.</small></span><ArrowRight size={18}/></Link><Link className="avara-inline-card" href="/blog"><BookOpen size={22}/><span><strong>Property insights</strong><small>Explore published articles and guides.</small></span><ArrowRight size={18}/></Link></div>
  </section>}
  <section className="avara-shell pb-16"><div className="avara-owner-note"><div><p className="avara-kicker">For property managers</p><p className="mt-2 text-sm text-[#5f685e]">Property Management OS, a separate software project.</p></div><a href={propertyOSRepository} className="avara-text-link">View on GitHub <ArrowUpRight size={16}/></a></div></section>
 </main><DiscoveryFooter/></div>;
}
