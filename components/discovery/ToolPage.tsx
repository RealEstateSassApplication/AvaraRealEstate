import type { ReactNode } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import { guides } from '@/lib/discovery/guides';
import { planningTools } from '@/lib/discovery/tools';

export default function ToolPage({slug,title,description,children}:{slug:string;title:string;description:string;children:ReactNode}){
  return <div className="avara-editorial min-h-screen"><Header/>
    <main className="avara-shell avara-section">
      <Link href="/tools" className="text-sm font-medium underline">All property tools</Link>
      <p className="mt-7 text-xs font-semibold uppercase tracking-widest">Avara Intelligence / Planning tools</p>
      <h1 className="mt-4 font-serif text-4xl sm:text-6xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-slate-700">{description}</p>
      {children}
      <section className="mt-12"><h2 className="font-serif text-3xl">More ways to plan</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{planningTools.filter(t=>t.slug!==slug).map(t=><Link key={t.slug} href={'/tools/'+t.slug} className="avara-tool-card"><p className="text-xs text-slate-600">{t.label}</p><h3 className="mt-2 font-serif text-xl">{t.title}</h3><p className="mt-2 text-sm text-slate-600">{t.description}</p><span className="mt-4 inline-block text-sm font-semibold underline">Open tool</span></Link>)}</div></section>
    <section className="mt-10 border-t pt-7"><h2 className="avara-display text-3xl">Understand the numbers</h2><div className="mt-4 flex flex-wrap gap-5">{guides.filter(g=>g.links.some(([,href])=>href==='/tools/'+slug)).map(g=><Link key={g.slug} href={'/guides/'+g.slug} className="avara-text-link">{g.title} →</Link>)}</div></section></main><DiscoveryFooter/></div>;
}
