import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Calculator, Compass, BookOpen } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import DiscoverySearch from '@/components/discovery/DiscoverySearch';
import DiscoveryListings from '@/components/discovery/DiscoveryListings';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { propertyOSRepository } from '@/lib/discovery/content';
import { getPublicContent } from '@/lib/discovery/repository';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const content = await getPublicContent();
  const { hero, sections, collections, neighbourhoods } = content;
  return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]">
    <Header />
    <main>
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:pt-12 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#20372e] px-7 py-14 text-white sm:px-12 sm:py-20 lg:min-h-[480px] lg:px-16">
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] bg-cover bg-center lg:block" style={{backgroundImage:"linear-gradient(90deg,#20372e 0%,rgba(32,55,46,.25) 60%),url('https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg')"}}/>
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#e1c58f]">{hero.eyebrow}</p>
          <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-7xl">{hero.title}</h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">{hero.description}</p>
          <Link href="/explore" className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-3 text-sm font-semibold hover:bg-white hover:text-[#20372e]">{hero.cta} <ArrowUpRight size={16}/></Link>
          <span className="absolute bottom-4 right-6 hidden text-xs text-white/90 lg:block">Illustrative architecture photograph</span>
        </div>
        <div className="relative mx-auto -mt-5 max-w-6xl px-1 sm:-mt-10 sm:px-4"><DiscoverySearch/></div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-600"><Link href="/listings?purpose=rent" className="hover:underline">Long-term rentals</Link><Link href="/listings?purpose=sale" className="hover:underline">Homes &amp; land</Link><Link href="/listings?purpose=booking" className="hover:underline">Short stays</Link><Link href="/tools/living-cost" className="hover:underline">Plan your budget</Link></div>
      </section>

      {sections.collections.enabled && <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#657557]">{sections.collections.eyebrow}</p>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">{sections.collections.title}</h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map(c=><Link key={c.href} href={c.href} className="group flex min-h-[190px] flex-col rounded-2xl border border-[#dedacf] bg-[#fdfcf8] p-6 transition hover:border-[#20372e]">
            <span className="text-xs text-[#806d50]">{c.number}</span><h3 className="mt-6 font-serif text-2xl">{c.title}</h3><p className="mt-2 flex-1 text-sm text-slate-600">{c.description}</p><ArrowUpRight className="mt-5 self-end transition group-hover:translate-x-1" size={20}/>
          </Link>)}
        </div>
      </section>}
      {sections.listings.enabled && <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#657557]">{sections.listings.eyebrow}</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">{sections.listings.title}</h2></div><Link className="inline-flex items-center gap-2 text-sm font-semibold underline" href="/listings">Browse all <ArrowRight size={16}/></Link></div>
        <div className="mt-7"><DiscoveryListings/></div>
      </section>}
      {sections.neighbourhoods.enabled && <section className="bg-[#e7e6da] py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em]">{sections.neighbourhoods.eyebrow}</p><h2 className="mt-3 max-w-2xl font-serif text-4xl sm:text-5xl">{sections.neighbourhoods.title}</h2></div><Link className="inline-flex items-center gap-2 text-sm font-semibold underline" href="/explore">Explore all places <ArrowRight size={16}/></Link></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{neighbourhoods.map((n,i)=><Link key={n.slug} href={'/explore/'+n.slug} style={{backgroundColor:n.accent}} className="group flex min-h-[220px] flex-col justify-between rounded-2xl p-5 text-white"><span className="text-xs text-white/85">0{i+1} / Colombo region</span><div><p className="text-xs text-white/85">{n.label}</p><h3 className="mt-2 font-serif text-2xl">{n.name}</h3><ArrowUpRight className="mt-5 transition group-hover:translate-x-1" size={20}/></div></Link>)}</div>
        </div>
      </section>}
      {sections.tools.enabled && <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#657557]">{sections.tools.eyebrow}</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">{sections.tools.title}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[{icon:Calculator,title:'Living cost calculator',desc:'Estimate your monthly expenses, including rent, transport and utilities.',href:'/tools/living-cost'},{icon:Compass,title:'Neighbourhood checklists',desc:'Know what to look for before choosing your next home.',href:'/explore'},{icon:BookOpen,title:'Property insights',desc:'Read the published articles and guides in our library.',href:'/blog'}].map(t=><Link key={t.href} href={t.href} className="rounded-2xl border border-[#dedacf] bg-white p-6 hover:border-[#20372e]"><t.icon size={25}/><h3 className="mt-5 font-serif text-2xl">{t.title}</h3><p className="mt-3 text-sm text-slate-600">{t.desc}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Explore <ArrowRight size={15}/></span></Link>)}
        </div>
      </section>}
      <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dedacf] px-6 py-5"><div><h2 className="font-semibold">For property managers</h2><p className="mt-1 text-sm text-slate-600">Explore the separate Property Management OS project.</p></div><a href={propertyOSRepository} className="inline-flex items-center gap-2 text-sm font-semibold underline">View on GitHub <ArrowUpRight size={16}/></a></div>
      </section>
    </main>
    <DiscoveryFooter/>
  </div>;
}
