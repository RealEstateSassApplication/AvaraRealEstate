'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contentSchema, type DiscoveryContent, type SectionKey } from '@/lib/discovery/schema';
import type { CMSState } from '@/lib/discovery/repository';

type Tab = 'home'|'collections'|'neighbourhoods'|'history';
const tabs: {id:Tab;label:string}[] = [{id:'home',label:'Homepage'},{id:'collections',label:'Collections'},{id:'neighbourhoods',label:'Neighbourhoods'},{id:'history',label:'Revision history'}];
const sections: SectionKey[] = ['collections','listings','neighbourhoods','tools'];
function Field({label,value,onChange,multiline=false,maxLength=300}:{label:string;value:string;onChange:(value:string)=>void;multiline?:boolean;maxLength?:number}){
  const cls='mt-2 block w-full rounded-lg border border-[#d8d8cc] bg-white p-3 text-sm text-slate-900';
  return <label className="block text-sm font-medium">{label}{multiline?<textarea className={cls} rows={3} maxLength={maxLength} value={value} onChange={e=>onChange(e.target.value)}/>:<input className={cls} maxLength={maxLength} value={value} onChange={e=>onChange(e.target.value)}/>}</label>;
}
export default function DiscoveryCMS(){
  const [state,setState]=useState<CMSState|null>(null);
  const [draft,setDraft]=useState<DiscoveryContent|null>(null);
  const [tab,setTab]=useState<Tab>('home');
  const [busy,setBusy]=useState(true);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [status,setStatus]=useState(0);
  const [conflict,setConflict]=useState(false);
  const dirty=!!(state&&draft&&JSON.stringify(state.draft)!==JSON.stringify(draft));
  async function load(){
    setBusy(true);setError('');setMessage('');setStatus(0);
    try{
      const res=await fetch('/api/admin/discovery',{cache:'no-store'});
      const data=await res.json();
      if(!res.ok){setStatus(res.status);throw new Error(data.error||'Could not load CMS.');}
      setState(data);setDraft(data.draft);setConflict(false);
    }catch(e){setError(e instanceof Error?e.message:'Could not load CMS.');}
    finally{setBusy(false);}
  }
  useEffect(()=>{void load();},[]);
  function edit(fn:(old:DiscoveryContent)=>DiscoveryContent){setDraft(old=>old?fn(old):old);setMessage('');setError('');}
  async function mutate(action:'save'|'publish'){
    if(!state||!draft||busy||conflict)return;
    if(action==='publish'&&(dirty||!state.revision))return;
    const parsed=contentSchema.safeParse(draft);
    if(!parsed.success){setError(parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join('; '));return;}
    if(action==='publish'&&!window.confirm('Publish the saved draft to the public Avara website?'))return;
    setBusy(true);setError('');setMessage('');
    try{
      const body=action==='save'?{action,expectedRevision:state.revision,content:parsed.data}:{action,expectedRevision:state.revision};
      const res=await fetch('/api/admin/discovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await res.json();
      if(!res.ok){if(res.status===409)setConflict(true);throw new Error(data.error||'Could not update CMS.');}
      setState(data);setDraft(data.draft);setMessage(action==='save'?'Draft saved. Public content is unchanged.':'Saved draft published.');
    }catch(e){setError(e instanceof Error?e.message:'Could not update CMS.');}
    finally{setBusy(false);}
  }
  function hero(key:keyof DiscoveryContent['hero'],v:string){edit(old=>({...old,hero:{...old.hero,[key]:v}}));}
  return <div className="min-h-screen bg-[#f4f1ea] text-[#20372e]"><main className="mx-auto max-w-7xl px-5 py-10">
    <Link href="/admin/dashboard" className="text-sm underline">Back to admin dashboard</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest">Avara editorial studio</p><h1 className="mt-2 font-serif text-4xl">Discovery CMS</h1><p className="mt-2 text-sm text-slate-600">Manage the public website without changing code.</p></div><Link href="/" className="rounded-lg border border-[#20372e] px-4 py-2 text-sm">View public site</Link></div>
    {error&&<p role="alert" className="mt-5 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-800">{error}</p>}
    {message&&<p role="status" className="mt-5 rounded-lg border bg-white p-4 text-sm">{message}</p>}
    {(!state||!draft)?<div className="mt-6 rounded-xl border bg-white p-6">{busy?'Loading editor…':status===401?<Link href="/auth/login" className="underline">Sign in</Link>:<button type="button" onClick={()=>void load()} className="underline">Retry</button>}</div>:<>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 text-sm"><span>Draft revision: {state.revision}</span><span>Published: {state.publishedRevision??'bundled baseline'}</span><span className="flex-1">{dirty?'Unsaved edits':state.revision!==state.publishedRevision?'Saved draft differs from public content':'Published'}</span>
        <button type="button" disabled={busy||!dirty||conflict} onClick={()=>void mutate('save')} className="rounded-lg border border-[#20372e] px-4 py-2 font-semibold disabled:opacity-40">Save draft</button>
        <button type="button" disabled={busy||dirty||!state.revision||state.revision===state.publishedRevision||conflict} onClick={()=>void mutate('publish')} className="rounded-lg bg-[#20372e] px-4 py-2 font-semibold text-white disabled:opacity-40">Publish saved draft</button>
        <button type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm('Discard unsaved local edits?'))void load();}} className="underline">Reload</button>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Editor sections">{tabs.map(t=><button key={t.id} type="button" aria-pressed={tab===t.id} onClick={()=>setTab(t.id)} className={'rounded-full px-4 py-2 text-sm '+(tab===t.id?'bg-[#20372e] text-white':'border bg-white')}>{t.label}</button>)}</nav>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <fieldset disabled={busy||conflict} className="min-w-0 space-y-5 rounded-xl border bg-white p-5 sm:p-7 disabled:opacity-70">
        {tab==='home'&&<><h2 className="font-serif text-2xl">Homepage hero</h2>
          <Field label="Eyebrow" value={draft.hero.eyebrow} maxLength={100} onChange={v=>hero('eyebrow',v)}/>
          <Field label="Headline" value={draft.hero.title} maxLength={100} onChange={v=>hero('title',v)}/>
          <Field label="Description" value={draft.hero.description} multiline onChange={v=>hero('description',v)}/>
          <Field label="Explore button label" value={draft.hero.cta} maxLength={60} onChange={v=>hero('cta',v)}/>
          {sections.map(k=><div key={k} className="space-y-3 border-t pt-5"><h3 className="font-semibold capitalize">{k}</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.sections[k].enabled} onChange={e=>edit(old=>({...old,sections:{...old.sections,[k]:{...old.sections[k],enabled:e.target.checked}}}))}/> Show on homepage</label>{(['eyebrow','title'] as const).map(f=><Field key={f} label={f==='title'?'Heading':'Eyebrow'} value={draft.sections[k][f]} maxLength={f==='title'?160:100} onChange={v=>edit(old=>({...old,sections:{...old.sections,[k]:{...old.sections[k],[f]:v}}}))}/>)}</div>)}
        </>}
        {tab==='collections'&&<><h2 className="font-serif text-2xl">Property collections</h2><p className="text-sm text-slate-600">Listing destinations are fixed to prevent broken links.</p>{draft.collections.map((c,i)=><div key={c.number} className="space-y-3 border-t pt-5"><p className="text-xs text-slate-600">{c.href}</p><Field label="Title" value={c.title} maxLength={100} onChange={v=>edit(old=>({...old,collections:old.collections.map((item,j)=>j===i?{...item,title:v}:item)}))}/><Field label="Description" value={c.description} maxLength={240} multiline onChange={v=>edit(old=>({...old,collections:old.collections.map((item,j)=>j===i?{...item,description:v}:item)}))}/></div>)}</>}
        {tab==='neighbourhoods'&&<><h2 className="font-serif text-2xl">Neighbourhood directory</h2><Field label="Directory headline" value={draft.directory.title} maxLength={120} onChange={v=>edit(old=>({...old,directory:{...old.directory,title:v}}))}/><Field label="Directory introduction" value={draft.directory.description} maxLength={500} multiline onChange={v=>edit(old=>({...old,directory:{...old.directory,description:v}}))}/>{draft.neighbourhoods.map((n,i)=><div key={n.slug} className="space-y-3 border-t pt-5"><h3 className="font-semibold">{n.name}</h3><Field label="Category label" value={n.label} maxLength={100} onChange={v=>edit(old=>({...old,neighbourhoods:old.neighbourhoods.map((a,j)=>j===i?{...a,label:v}:a)}))}/><Field label="Introduction" value={n.intro} maxLength={600} multiline onChange={v=>edit(old=>({...old,neighbourhoods:old.neighbourhoods.map((a,j)=>j===i?{...a,intro:v}:a)}))}/>{n.checks.map((check,k)=><Field key={k} label={'Viewing tip '+(k+1)} value={check} maxLength={300} multiline onChange={v=>edit(old=>({...old,neighbourhoods:old.neighbourhoods.map((a,j)=>j===i?{...a,checks:a.checks.map((c,h)=>h===k?v:c)}:a)}))}/>)}</div>)}</>}
        {tab==='history'&&<><h2 className="font-serif text-2xl">Recent revisions</h2><p className="text-sm text-slate-600">The last 20 saved and published revisions. Restoring earlier versions is not available yet.</p>{state.history.length===0?<p>No stored revisions yet.</p>:state.history.map(h=><div key={h.revision} className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm"><span>Revision {h.revision} · {h.action}</span><time dateTime={h.created_at}>{new Date(h.created_at).toLocaleString()}</time></div>)}</>}
      </fieldset>
      <aside className="self-start rounded-xl border bg-white p-5 lg:sticky lg:top-5"><p className="text-xs font-semibold uppercase tracking-widest">Draft preview / content only</p><div className="mt-4 rounded-xl bg-[#20372e] p-6 text-white"><p className="text-xs uppercase text-[#e1c58f]">{draft.hero.eyebrow}</p><p className="mt-3 font-serif text-4xl">{draft.hero.title}</p><p className="mt-4 text-sm">{draft.hero.description}</p><span className="mt-4 inline-block rounded-full border px-4 py-2 text-xs">{draft.hero.cta}</span></div>
        {sections.filter(k=>draft.sections[k].enabled).map(k=><div key={k} className="mt-4 rounded-lg border p-4"><p className="text-xs text-slate-600">{draft.sections[k].eyebrow}</p><h3 className="mt-1 font-serif text-xl">{draft.sections[k].title}</h3>{k==='collections'&&draft.collections.map(c=><p key={c.number} className="mt-2 text-sm">{c.title}</p>)}{k==='neighbourhoods'&&draft.neighbourhoods.map(n=><p key={n.slug} className="mt-2 text-sm">{n.name} · {n.label}</p>)}</div>)}
      </aside></div>
    </>}
  </main></div>;
}
