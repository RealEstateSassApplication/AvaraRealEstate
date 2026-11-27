'use client';
import Link from 'next/link';
import type {ComponentProps} from 'react';
import PropertyCard from '@/components/property/PropertyCard';
import {useSavedProperties} from './useSavedProperties';
export default function SavedCollection({initial}:{initial:ComponentProps<typeof PropertyCard>['property'][]}){
 const saved=useSavedProperties();
 const visible=saved.ready&&saved.signedIn?initial.filter(p=>saved.ids.includes(p._id)):initial;
 return <section className="mt-8">{saved.error&&<p role="alert" className="mb-4 text-sm">{saved.error}</p>}{visible.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p=><PropertyCard key={p._id} property={p} isFavorite onToggleFavorite={saved.ready?()=>void saved.toggle(p._id):undefined}/>)}</div>:<div className="rounded-xl border bg-white p-8"><h2 className="avara-display text-3xl">Your shortlist is empty.</h2><Link href="/listings" className="avara-text-link mt-4">Discover properties →</Link></div>}</section>;
}
