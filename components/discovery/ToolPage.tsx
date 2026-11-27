import type { ReactNode } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { planningTools } from '@/lib/discovery/tools';

export default function ToolPage({slug,title,description,children}:{slug:string;title:string;description:string;children:ReactNode}){
  return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]"><Header/>
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <Link href="/tools" className="text-sm font-medium underline">All property tools</Link>
      <p className="mt-7 text-xs font-semibold uppercase tracking-widest">Avara Intelligence / Planning tools</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-6xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-slate-700">{description}</p>
      {children}
      <section className="mt-12"><h2 className="font-serif text-3xl">More ways to plan</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{planningTools.filter(t=>t.slug!==slug).map(t=><Link key={t.slug} href={'/tools/'+t.slug} className="rounded-xl border border-[#d8d8cc] bg-white p-5 hover:border-[#20372e]"><p className="text-xs text-slate-600">{t.label}</p><h3 className="mt-2 font-serif text-xl">{t.title}</h3><p className="mt-2 text-sm text-slate-600">{t.description}</p><span className="mt-4 inline-block text-sm font-semibold underline">Open tool</span></Link>)}</div></section>
    </main><DiscoveryFooter/></div>;
}
