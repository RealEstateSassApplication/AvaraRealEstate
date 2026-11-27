import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { planningTools } from '@/lib/discovery/tools';
import { Calculator, Landmark, Scale, Ruler, ArrowUpRight } from 'lucide-react';
export const metadata:Metadata={title:'Property planning tools',description:'Free LKR living cost, mortgage, rent versus buy and land area calculators for property planning in Sri Lanka.',alternates:{canonical:'/tools'}};
const icons=[Calculator,Landmark,Scale,Ruler];
export default function ToolsPage(){
 return <div className="avara-editorial min-h-screen"><Header/><main className="avara-shell avara-section">
 <section className="rounded-[1.35rem] bg-[#243b31] px-7 py-14 text-white sm:p-16"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#e1c58f]">Avara Intelligence</p><h1 className="mt-5 max-w-3xl font-serif text-5xl sm:text-7xl">Make the numbers work for you.</h1><p className="mt-5 max-w-xl text-white/85">Practical property planning tools for your next home, land purchase or move. No account or personal details needed.</p></section>
 <div className="mt-8 grid gap-5 sm:grid-cols-2">{planningTools.map((t,i)=>{const Icon=icons[i];return <Link key={t.slug} href={'/tools/'+t.slug} className="avara-tool-card group"><Icon size={28}/><p className="mt-5 text-xs uppercase tracking-widest text-slate-600">{t.label}</p><h2 className="mt-2 font-serif text-3xl">{t.title}</h2><p className="mt-3 text-sm text-slate-600">{t.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Open calculator <ArrowUpRight size={17}/></span></Link>})}</div>
 <section className="mt-8 rounded-xl border border-[#d8d8cc] p-6"><h2 className="font-serif text-2xl">Explore with confidence</h2><p className="mt-2 text-sm text-slate-700">All financial calculators use your own assumptions. They do not represent lender offers or current market prices. Your entries are calculated locally in your browser.</p><Link href="/explore" className="mt-4 inline-block text-sm font-semibold underline">Explore neighbourhoods</Link></section>
 </main><DiscoveryFooter/></div>;
}
