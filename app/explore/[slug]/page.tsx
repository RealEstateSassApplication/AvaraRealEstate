import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { neighbourhoods } from '@/lib/discovery/content';

export const dynamicParams = false;
export function generateStaticParams(){return neighbourhoods.map(n=>({slug:n.slug}));}
type Props = {params:{slug:string}};
export function generateMetadata({params}:Props):Metadata {
 const n=neighbourhoods.find(a=>a.slug===params.slug);
 if(!n)return {title:'Neighbourhood not found'};
 return {title:'Explore '+n.name,description:'Property viewing checklist, rental discovery and living cost planning for '+n.name+'.',alternates:{canonical:'/explore/'+n.slug}};
}
export default function AreaPage({params}:Props){
 const n=neighbourhoods.find(a=>a.slug===params.slug);
 if(!n)notFound();
 const city=encodeURIComponent(n.name);
 return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]"><Header/><main className="mx-auto max-w-6xl px-5 py-12">
  <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-medium underline"><ArrowLeft size={16}/> All neighbourhoods</Link>
  <section style={{backgroundColor:n.accent}} className="mt-6 rounded-[2rem] p-8 text-white sm:p-14"><p className="text-xs uppercase tracking-[.2em]">Colombo region / {n.label}</p><h1 className="mt-6 font-serif text-6xl sm:text-8xl">{n.name}</h1><p className="mt-5 max-w-xl text-lg text-white/90">{n.intro}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={'/listings?purpose=rent&city='+city} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#20372e]">Browse rentals</Link><Link href={'/listings?purpose=sale&city='+city} className="rounded-full border border-white px-5 py-3 text-sm font-semibold">Browse sales</Link></div></section>
  <div className="mt-8 grid gap-5 md:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-[#dedacf] bg-white p-7"><h2 className="font-serif text-3xl">Before you visit</h2><p className="mt-2 text-sm text-slate-600">Questions to investigate at the specific property.</p><ul className="mt-6 space-y-5">{n.checks.map(c=><li key={c} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={19}/><span className="text-sm leading-relaxed">{c}</span></li>)}</ul></section>
  <section className="rounded-2xl border border-[#dedacf] bg-white p-7"><h2 className="font-serif text-3xl">Know your budget.</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">Compare the actual advertised rent, transport, utilities and other monthly expenses before committing.</p><Link className="mt-6 inline-block rounded-lg bg-[#20372e] px-5 py-3 text-sm font-semibold text-white" href="/tools/living-cost">Open calculator</Link></section></div>
  <p className="mt-6 text-xs text-slate-600">Editorial planning checklist. Avara has not published verified rental averages, travel times or local amenity rankings for this area.</p>
 </main><DiscoveryFooter/></div>;
}
