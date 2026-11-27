'use client';
import { useEffect, useMemo, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import Header from '@/components/ui/layout/Header';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import SearchFilters from '@/components/search/SearchFilters';
import PropertyCard from '@/components/property/PropertyCard';
import { Grid3X3, List, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { listingQuery, parseListingQuery, type ListingFilters } from '@/lib/discovery/listing-query';
import { useSavedProperties } from '@/components/discovery/useSavedProperties';
type Property=ComponentProps<typeof PropertyCard>['property'];
const button='inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#dedbd0] bg-white px-4 text-sm font-semibold disabled:opacity-40';
function ListingsContent(){
 const router=useRouter(), params=useSearchParams();
 const raw=params?.toString()||'';
 const {filters,page}=useMemo(()=>parseListingQuery(raw),[raw]);
 const canonical=listingQuery(filters,page);
 const [properties,setProperties]=useState<Property[]>([]);
 const [total,setTotal]=useState(0),[pages,setPages]=useState(1);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [retry,setRetry]=useState(0);
 const [mode,setMode]=useState<'grid'|'list'>('grid');
 const saved=useSavedProperties();
 const resultsRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const c=new AbortController();setState('loading');
  const p=new URLSearchParams(canonical);p.set('limit','20');
  fetch('/api/properties?'+p,{signal:c.signal,cache:'no-store'}).then(async res=>{if(!res.ok)throw Error('Unavailable');const d=await res.json();if(!Array.isArray(d.properties))throw Error('Invalid response');if(c.signal.aborted)return;setProperties(d.properties);setTotal(Number(d.total)||0);setPages(Math.max(1,Number(d.totalPages)||1));setState('ready');}).catch(()=>{if(!c.signal.aborted){setProperties([]);setState('error');}});
  return ()=>c.abort();
 },[canonical,retry]);
 function navigate(f:ListingFilters,p=1){const q=listingQuery(f,p);if(q===canonical){setRetry(n=>n+1);return;}router.push('/listings'+(q?'?'+q:''),{scroll:false});}
 const title=filters.purpose==='rent'?'Homes for rent':filters.purpose==='sale'?'Properties for sale':filters.purpose==='booking'?'Find a stay':'Discover properties';
 return <div className="avara-editorial min-h-screen"><Header/><main className="avara-shell py-8 sm:py-14" id="main-content">
  <p className="avara-kicker">Avara / The property collection</p><h1 className="avara-display mt-3 text-[clamp(2.5rem,5vw,4.6rem)] leading-tight">{title}{filters.city?' in '+filters.city:''}</h1><p className="mt-3 mb-7 max-w-xl text-sm leading-relaxed text-[#5f685e]">Find a place that fits the way you live. Explore available listings and refine your search.</p>
  <nav className="mb-5 flex flex-wrap gap-2" aria-label="Discovery tools"><Link className={button} href={"/map"+(canonical?"?"+canonical:"")}>Map view</Link></nav>
  <SearchFilters filters={filters} onFiltersChange={f=>navigate(f)} loading={state==='loading'}/>
  {saved.error&&<p role="alert" className="mb-4 rounded-lg border bg-white p-3 text-sm">{saved.error}</p>}
  <div ref={resultsRef} className="mb-5 flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-[#5f685e]">{state==='loading'?'Finding properties…':state==='error'?'Listings unavailable':total.toLocaleString()+' properties found'}</p><div className="hidden gap-2 sm:flex">{(['grid','list'] as const).map(m=><button key={m} type="button" aria-label={m==='grid'?'Grid view':'List view'} aria-pressed={mode===m} onClick={()=>setMode(m)} className={button+' '+(mode===m?'!bg-[#243b31] text-white':'')}>{m==='grid'?<Grid3X3 size={18}/>:<List size={18}/>}</button>)}</div></div>
  {state==='loading'?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading properties">{[0,1,2,3,4,5].map(i=><div key={i} className="h-80 animate-pulse rounded-xl bg-[#e8e5dc]"/>)}</div>:state==='error'?<div role="alert" className="rounded-xl border bg-white p-8 text-center"><h2 className="avara-display text-3xl">Listings are temporarily unavailable.</h2><button className={button+' mt-5'} onClick={()=>setRetry(n=>n+1)}>Retry</button></div>:properties.length===0?<div className="rounded-xl border bg-white p-10 text-center"><MapPin className="mx-auto mb-4 text-[#657557]" size={32}/><h2 className="avara-display text-3xl">No matching properties</h2><p className="mt-3 text-sm text-slate-600">Try a different location or adjust your filters.</p><button className={button+' mt-5'} onClick={()=>navigate({})}>Clear all filters</button></div>:<div className={mode==='grid'?'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4':'grid gap-5 sm:grid-cols-1'}>{properties.map(p=><PropertyCard key={p._id} property={p} isFavorite={saved.ids.includes(p._id)} onToggleFavorite={saved.ready?()=>void saved.toggle(p._id):undefined} className={mode==='list'?'avara-list-card':'h-full'}/>)}</div>}
  {state==='ready'&&pages>1&&<nav aria-label="Property pages" className="mt-8 flex flex-wrap items-center justify-center gap-3"><button className={button} disabled={page<=1} onClick={()=>{navigate(filters,page-1);resultsRef.current?.scrollIntoView({block:'start'});}}><ChevronLeft size={16}/> Previous</button><span className="text-sm">Page {page} of {pages}</span><button className={button} disabled={page>=pages} onClick={()=>{navigate(filters,page+1);resultsRef.current?.scrollIntoView({block:'start'});}}>Next <ChevronRight size={16}/></button></nav>}
  {state==='ready'&&page>pages&&<button className={button+' mt-5'} onClick={()=>navigate(filters,1)}>Return to first page</button>}
  <div className="mt-12 border-t pt-6"><Link href="/explore" className="avara-text-link">Explore neighbourhoods instead →</Link></div>
 </main><DiscoveryFooter/></div>;
}
export default function ListingsPage(){return <Suspense fallback={<div className="avara-editorial min-h-screen"><Header/><main className="avara-shell py-12"><p role="status">Loading properties…</p></main></div>}><ListingsContent/></Suspense>;}
