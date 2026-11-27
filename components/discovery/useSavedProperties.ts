'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
export function useSavedProperties(){
 const router=useRouter();
 const [ids,setIds]=useState<string[]>([]);
 const [ready,setReady]=useState(false),[signedIn,setSignedIn]=useState(false),[error,setError]=useState('');
 const pending=useRef(new Set<string>());
 useEffect(()=>{const c=new AbortController();fetch('/api/favorites',{signal:c.signal,cache:'no-store'}).then(async r=>{if(r.status===401){setSignedIn(false);return;}if(!r.ok)throw Error('Could not load saved properties.');const d=await r.json();if(!c.signal.aborted){setIds(Array.isArray(d.ids)?d.ids:[]);setSignedIn(true);}}).catch(()=>{if(!c.signal.aborted)setError('Saved properties could not be loaded. Refresh to retry.');}).finally(()=>{if(!c.signal.aborted)setReady(true);});return()=>c.abort();},[]);
 async function toggle(id:string){
  if(!ready||pending.current.has(id))return;
  if(!signedIn){if(error)return;router.push('/auth/login?next='+encodeURIComponent(window.location.pathname+window.location.search));return;}
  pending.current.add(id);setError('');
  const desired=!ids.includes(id);
  try{const r=await fetch('/api/properties/'+encodeURIComponent(id)+'/favorite',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({favorite:desired})});if(r.status===401){router.push('/auth/login?next='+encodeURIComponent(window.location.pathname+window.location.search));return;}if(!r.ok)throw Error('Could not update saved property. Please retry.');setIds(old=>desired?Array.from(new Set([...old,id])):old.filter(x=>x!==id));}
  catch(e){setError(e instanceof Error?e.message:'Could not update saved property.');}
  finally{pending.current.delete(id);}
 }
 return {ids,ready,signedIn,error,toggle};
}
