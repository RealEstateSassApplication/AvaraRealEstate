'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
  if(status==='error') return <div role="alert" className="rounded-xl border border-[#dedacf] bg-white p-8"><h3 className="font-semibold">Listings are temporarily unavailable.</h3><p className="mt-2 text-sm text-slate-600">You can still explore neighbourhood guides and planning tools.</p><button type="button" className="mt-4 underline" onClick={retry}>Try again</button></div>;
  if(!items.length) return <div className="rounded-xl border border-[#dedacf] bg-white p-8"><h3 className="font-semibold">No published listings yet.</h3><p className="mt-2 text-sm text-slate-600">Explore places or plan a budget while new listings are added.</p><Link href="/explore" className="mt-4 inline-block underline">Explore places</Link></div>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(p=><PropertyCard key={p._id} property={p} className="h-full rounded-xl border-[#e5e1d7]"/>)}</div>;
}
