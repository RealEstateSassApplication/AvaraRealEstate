'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Search, ArrowUpRight, MapPin, Building2, Wallet } from 'lucide-react';

const purposes = [{value:'rent',label:'Rent'}, {value:'sale',label:'Buy'}, {value:'booking',label:'Stay'}] as const;
type Purpose = typeof purposes[number]['value'];
const types = [{value:'',label:'Any property'},{value:'house',label:'House'},{value:'apartment',label:'Apartment'},{value:'villa',label:'Villa'},{value:'land',label:'Land'},{value:'room',label:'Room'},{value:'commercial',label:'Commercial'}];

export default function DiscoverySearch() {
  const router = useRouter();
  const [purpose,setPurpose] = useState<Purpose>('rent');
  const [city,setCity] = useState('');
  const [type,setType] = useState('');
  const [budget,setBudget] = useState('');
  const [error,setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (budget !== '' && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
      setError('Enter a valid non-negative budget.'); return;
    }
    setError('');
    const query = new URLSearchParams({purpose});
    if (city.trim()) query.set('city',city.trim());
    if (type) query.set('type',type);
    if (budget !== '') query.set('maxPrice',budget);
    router.push('/listings?'+query.toString());
  }
  const label = purpose === 'rent' ? 'Maximum listed rent' : purpose === 'sale' ? 'Maximum purchase price' : 'Maximum listed nightly price';
  return <form onSubmit={submit} className="avara-search-panel">
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e3dfd2] pb-4" aria-label="Property purpose">
      <span className="mr-3 hidden text-[10px] font-semibold uppercase tracking-[.18em] text-[#657557] sm:inline">Find a property</span>{purposes.map(p => <button key={p.value} type="button" aria-pressed={purpose===p.value} onClick={()=>{setPurpose(p.value);setBudget('');setError('');}} className={'rounded-full px-5 py-2 text-sm font-medium transition '+(purpose===p.value?'bg-[#20372e] text-white':'bg-[#f4f1ea] hover:bg-[#e8e5db]')}>{p.label}</button>)}
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
      <label className="block text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><MapPin size={15} strokeWidth={1.6}/> City or neighbourhood</span><input maxLength={120} value={city} onChange={e=>setCity(e.target.value)} placeholder="Any city or district" className="mt-2 block h-12 w-full avara-control px-3 text-sm font-normal"/></label>
      <label className="block text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><Building2 size={15} strokeWidth={1.6}/> Property type</span><Select value={type||'any'} onValueChange={v=>setType(v==='any'?'':v)}><SelectTrigger aria-label="Property type" className="avara-control mt-2 h-12"><SelectValue placeholder="Any property"/></SelectTrigger><SelectContent>{types.map(t=><SelectItem key={t.value||'any'} value={t.value||'any'}>{t.label}</SelectItem>)}</SelectContent></Select></label>
      <label className="block text-xs font-semibold"><span className="inline-flex items-center gap-1.5"><Wallet size={15} strokeWidth={1.6}/> {label} (LKR)</span><input type="number" min="0" step="any" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Any budget" className="mt-2 block h-12 w-full rounded-lg border border-[#dedacf] bg-[#f7f5ef] px-3 text-sm font-normal"/></label>
      <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-lg avara-primary px-5 text-sm font-semibold hover:bg-[#374d43]"><Search size={17}/> Explore properties <ArrowUpRight size={15}/></button>
    </div>
    {purpose==='rent'&&<p className="mt-3 text-xs text-slate-500">Check the rental period on each listing; price filters use the listed amount.</p>}
    {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </form>;
}
