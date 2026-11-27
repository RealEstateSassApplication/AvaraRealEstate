'use client';
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { type ListingFilters, normalizeFilters, filterCount } from '@/lib/discovery/listing-query';

const purposes=[['','All'],['rent','Rent'],['sale','Buy'],['booking','Stays']] as const;
const types=['apartment','house','villa','bungalow','land','commercial','room','studio','penthouse','duplex','office','warehouse','shop','serviced-apartment'];
const amenities=['Parking','Swimming Pool','Garden','Security','Elevator','Balcony','Air Conditioning','Furnished','Internet','Gym','Playground','Backup Power','CCTV','Gated Community'];
const provinces=['Western','Central','Southern','Northern','Eastern','North Western','North Central','Uva','Sabaragamuwa'];
const field='mt-1 h-12 w-full rounded-lg border border-[#dedbd0] bg-white px-3 text-base text-[#243b31]';
type Props={filters:ListingFilters;onFiltersChange:(f:ListingFilters)=>void;onSearch?:()=>void;loading?:boolean};
export default function SearchFilters({filters,onFiltersChange,loading=false}:Props){
 const [draft,setDraft]=useState<ListingFilters>(filters);
 const [open,setOpen]=useState(false);
 const [low,setLow]=useState(filters.minPrice?.toString()??'');
 const [high,setHigh]=useState(filters.maxPrice?.toString()??'');
 const [error,setError]=useState('');
 useEffect(()=>{setDraft(filters);setLow(filters.minPrice?.toString()??'');setHigh(filters.maxPrice?.toString()??'');setError('');},[filters]);
 function edit<K extends keyof ListingFilters>(key:K,value:ListingFilters[K]){setDraft(old=>({...old,[key]:value}));}
 function apply(){
  const min=low.trim()===''?undefined:Number(low),max=high.trim()===''?undefined:Number(high);
  if([min,max].some(v=>v!==undefined&&(!Number.isFinite(v)||v<0||v>1e12))||(min!==undefined&&max!==undefined&&min>max)){setError('Enter valid LKR amounts; minimum must not exceed maximum.');return;}
  onFiltersChange(normalizeFilters({...draft,minPrice:min,maxPrice:max}));setOpen(false);setError('');
 }
 function clear(){setDraft({});setLow('');setHigh('');setError('');onFiltersChange({});setOpen(false);}
 function changePurpose(p:ListingFilters['purpose']){const next={...filters,purpose:p,minPrice:undefined,maxPrice:undefined};onFiltersChange(normalizeFilters(next));}
 function toggle(key:'type'|'amenities',v:string){const values=draft[key]||[];edit(key,values.includes(v)?values.filter(x=>x!==v):[...values,v]);}
 const count=filterCount(filters);
 return <section aria-label="Property filters" className="mb-8 rounded-2xl border border-[#dedbd0] bg-white p-4 sm:p-6">
  <div className="flex flex-wrap items-center gap-2">{purposes.map(([value,label])=><button key={label} type="button" aria-pressed={(filters.purpose||'')===value} onClick={()=>changePurpose(value||undefined)} className={'min-h-[44px] rounded-full px-4 text-sm font-medium '+((filters.purpose||'')===value?'bg-[#243b31] text-white':'border border-[#dedbd0] text-[#243b31] hover:bg-[#f7f5ef]')}>{label}</button>)}</div>
  <form onSubmit={e=>{e.preventDefault();apply();}} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
   <label className="min-w-0 text-xs font-semibold">Location<input aria-label="Location" className={field} maxLength={120} placeholder="City or neighbourhood" value={draft.city||''} onChange={e=>edit('city',e.target.value)}/></label>
   <label className="min-w-0 text-xs font-semibold">Keyword<input aria-label="Keyword" className={field} maxLength={200} placeholder="Search property details" value={draft.search||''} onChange={e=>edit('search',e.target.value)}/></label>
   <button type="submit" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#243b31] px-5 text-sm font-semibold text-white"><Search size={18}/> Search</button>
   <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><button type="button" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-[#dedbd0] px-4 text-sm font-semibold"><SlidersHorizontal size={17}/> Filters {count>0&&<span className="rounded-full bg-[#eaece2] px-2 py-1 text-xs">{count}</span>}</button></SheetTrigger>
   <SheetContent side="right" className="flex h-[100dvh] w-full max-w-[100vw] flex-col gap-0 bg-[#f7f5ef] p-0 sm:max-w-[440px]">
    <SheetHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left"><SheetTitle className="avara-display text-3xl text-[#243b31]">Refine your search</SheetTitle><SheetDescription>Choose the details that matter to you.</SheetDescription></SheetHeader>
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
     <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">District<input className={field} value={draft.district||''} onChange={e=>edit('district',e.target.value)} maxLength={120}/></label><label className="text-sm font-medium">Province<select className={field} value={draft.province||''} onChange={e=>edit('province',e.target.value||undefined)}><option value="">Any province</option>{provinces.map(p=><option key={p}>{p}</option>)}</select></label></div>
     <fieldset><legend className="mb-3 font-semibold">Property types</legend><div className="grid grid-cols-2 gap-2">{types.map(t=><label key={t} className="flex min-h-[44px] items-center gap-2 rounded-lg border bg-white px-2 text-sm capitalize"><input type="checkbox" checked={!!draft.type?.includes(t)} onChange={()=>toggle('type',t)} className="h-4 w-4 accent-[#243b31]"/>{t.replaceAll('-',' ')}</label>)}</div></fieldset>
     <fieldset><legend className="mb-3 font-semibold">Listed price (LKR)</legend><div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm">Minimum<input className={field} type="number" min="0" value={low} onChange={e=>setLow(e.target.value)} placeholder="Any"/></label><label className="min-w-0 text-sm">Maximum<input className={field} type="number" min="0" value={high} onChange={e=>setHigh(e.target.value)} placeholder="Any"/></label></div><p className="mt-2 text-xs text-slate-600">Compare the listed rental period separately.</p></fieldset>
     {!(draft.type?.length===1&&draft.type[0]==='land')&&<div className="grid grid-cols-2 gap-3">{(['bedrooms','bathrooms'] as const).map(k=><label key={k} className="text-sm capitalize">Minimum {k}<select className={field} value={draft[k]??''} onChange={e=>edit(k,e.target.value?Number(e.target.value):undefined)}><option value="">Any</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+</option>)}</select></label>)}</div>}
     <fieldset><legend className="mb-3 font-semibold">Amenities</legend><div className="grid grid-cols-2 gap-2">{amenities.map(t=><label key={t} className="flex min-h-[44px] items-center gap-2 rounded-lg border bg-white px-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#243b31]" checked={!!draft.amenities?.includes(t)} onChange={()=>toggle('amenities',t)}/>{t}</label>)}</div></fieldset>
     <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.verified} onChange={e=>edit('verified',e.target.checked||undefined)}/> Verified listings only</label>
    </div>
    <div className="shrink-0 border-t bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{error&&<p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<div className="flex gap-3"><button type="button" onClick={clear} className="min-h-[48px] rounded-lg border px-4 text-sm font-semibold">Reset all</button><button type="button" onClick={apply} className="min-h-[48px] flex-1 rounded-lg bg-[#243b31] px-4 text-sm font-semibold text-white">Apply filters</button></div></div>
   </SheetContent></Sheet>
  </form>
  {error&&!open&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">{count>0&&<><span>{count} active filters</span><button type="button" onClick={clear} className="inline-flex min-h-[44px] items-center gap-1 underline"><X size={14}/> Clear all</button></>}{loading&&<span role="status">Updating results…</span>}</div>
 </section>;
}
