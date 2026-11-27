import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { neighbourhoods } from '@/lib/discovery/content';

export const metadata: Metadata = { title:'Explore neighbourhoods in Sri Lanka',description:'Discover five Colombo-area neighbourhoods with practical property viewing checklists and rental links.',alternates:{canonical:'/explore'} };

export default function ExplorePage() {
 return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]"><Header/><main className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
  <p className="text-xs font-semibold uppercase tracking-[.2em]">The neighbourhood edit</p><h1 className="mt-4 max-w-3xl font-serif text-5xl sm:text-7xl">Find a place that fits your life.</h1><p className="mt-5 max-w-2xl text-lg text-slate-700">Start with five places in the Colombo region. Use practical viewing questions, browse properties and build your own budget. These are planning checklists, not market rankings or measured area profiles.</p>
  <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{neighbourhoods.map((n,i)=><Link key={n.slug} href={'/explore/'+n.slug} className="overflow-hidden rounded-2xl border border-[#dedacf] bg-white hover:border-[#20372e]"><div className="flex min-h-[180px] flex-col justify-between p-6 text-white" style={{backgroundColor:n.accent}}><p className="text-xs">0{i+1} / Colombo region</p><div><p className="text-xs">{n.label}</p><h2 className="mt-2 font-serif text-4xl">{n.name}</h2></div></div><div className="p-6"><p className="text-sm leading-relaxed text-slate-600">{n.intro}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Explore {n.name} <ArrowUpRight size={16}/></span></div></Link>)}</div>
  <section className="mt-10 rounded-2xl bg-[#20372e] p-8 text-white"><h2 className="font-serif text-3xl">Compare your total living budget.</h2><p className="mt-3 text-white/85">Use your own rent and expenses. No account required.</p><Link href="/tools/living-cost" className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#20372e]">Estimate living costs</Link></section>
 </main><DiscoveryFooter/></div>;
}
