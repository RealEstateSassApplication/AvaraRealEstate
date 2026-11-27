import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import type { DiscoveryContent } from '@/lib/discovery/schema';
import ArchitectureArt, { type ArtKind } from './ArchitectureArt';
const collectionArt: ArtKind[]=['apartment','house','land','stay'];
const areaArt: Record<string,ArtKind>={colombo:'city',nugegoda:'apartment',maharagama:'garden',rajagiriya:'house',dehiwala:'coast'};
export function SectionHeading({eyebrow,title,href,linkLabel}:{eyebrow:string;title:string;href?:string;linkLabel?:string}){
 return <div className="avara-section-heading"><div><p className="avara-kicker">{eyebrow}</p><h2 className="avara-display mt-3 text-[clamp(2.2rem,4.7vw,4.25rem)] leading-[1.03]">{title}</h2></div>{href&&<Link href={href} className="avara-text-link">{linkLabel||'Explore all'} <ArrowUpRight size={17}/></Link>}</div>;
}
export function CollectionCards({items}:{items:DiscoveryContent['collections']}){
 return <div className="mt-9 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">{items.map((c,i)=><Link key={c.href} href={c.href} className="avara-editorial-card group block">
  <div className="avara-art-frame"><ArchitectureArt kind={collectionArt[i]||'house'} className="avara-art"/><span className="avara-art-index">0{i+1}</span><span className="avara-round-arrow"><ArrowUpRight size={19}/></span></div>
  <div className="pt-5"><h3 className="avara-display text-[1.75rem] leading-tight">{c.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#5f685e]">{c.description}</p></div>
 </Link>)}</div>;
}
export function AreaCards({items,compact=false}:{items:DiscoveryContent['neighbourhoods'];compact?:boolean}){
 return <div className={'mt-9 grid gap-5 sm:grid-cols-2 '+(compact?'lg:grid-cols-12':'lg:grid-cols-3')}>{items.map((n,i)=><Link key={n.slug} href={'/explore/'+n.slug} className={'avara-editorial-card group block '+(compact?(i<2?'lg:col-span-6':'lg:col-span-4'):'')}>
  <div className={'avara-area-frame '+(compact&&i<2?'avara-area-wide':'')}><ArchitectureArt kind={areaArt[n.slug]||'city'} className="avara-art"/><div className="avara-area-shade"/><div className="avara-area-copy"><p className="text-[10px] uppercase tracking-[.19em] text-white/90">Colombo region / 0{i+1}</p><div><p className="text-xs text-white/90">{n.label}</p><h3 className="avara-display mt-1 text-4xl sm:text-5xl">{n.name}</h3></div></div><span className="avara-round-arrow"><ArrowUpRight size={20}/></span></div>
  {!compact&&<div className="pt-4"><p className="text-sm leading-relaxed text-[#5f685e]">{n.intro}</p><span className="avara-text-link mt-3">Read the checklist <ArrowRight size={15}/></span></div>}
 </Link>)}</div>;
}
