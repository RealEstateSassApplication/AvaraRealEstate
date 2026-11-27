'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, House } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import type { ComponentProps } from 'react';

type Property = ComponentProps<typeof PropertyCard>['property'];

export default function DiscoveryListings() {
  const [items,setItems] = useState<Property[]>([]);
  const [status,setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt,setAttempt] = useState(0);
  const retry = useCallback(()=>setAttempt(n=>n+1),[]);
  useEffect(()=>{
    const controller = new AbortController();
    setStatus('loading');
    (async()=>{
      try {
        const response = await fetch('/api/properties?limit=6',{signal:controller.signal,cache:'no-store'});
        if(!response.ok) throw new Error('Listing service unavailable');
        const data = await response.json();
        if(!Array.isArray(data.properties)) throw new Error('Invalid response');
        if(!controller.signal.aborted){setItems(data.properties);setStatus('ready');}
      } catch {if(!controller.signal.aborted){setItems([]);setStatus('error');}}
    })();
    return ()=>controller.abort();
  },[attempt]);
  if(status==='loading') return <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(n=><div key={n} className="h-72 animate-pulse rounded-xl bg-[#e8e5dc]"/>)}<span className="sr-only">Loading available listings</span></div>;
  if(status==='error') return <div role="alert" className="rounded-[1rem] border border-[#dedacf] bg-white p-8 sm:p-12"><House size={26} strokeWidth={1.4} className="mb-5 text-[#657557]"/><h3 className="avara-display text-3xl">Listings are temporarily unavailable.</h3><p className="mt-2 text-sm text-slate-600">You can still explore neighbourhoods or try again.</p><button type="button" className="mt-4 underline" onClick={retry}>Try again</button></div>;
  if(!items.length) return <div className="rounded-[1rem] border border-[#dedacf] bg-white p-8 sm:p-12"><House size={26} strokeWidth={1.4} className="mb-5 text-[#657557]"/><h3 className="avara-display text-3xl">No published listings yet.</h3><p className="mt-2 text-sm text-slate-600">Explore places while new listings are added.</p><Link href="/explore" className="avara-text-link mt-5">Explore places <ArrowUpRight size={16}/></Link></div>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(p=><PropertyCard key={p._id} property={p} className="h-full rounded-[1rem] border-[#e5e1d7]"/>)}</div>;
}
