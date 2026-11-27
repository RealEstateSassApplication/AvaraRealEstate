'use client';
import {useState} from 'react';
import {ChevronLeft,ChevronRight,Images} from 'lucide-react';
export default function ListingGallery({images,title}:{images:string[];title:string}){
 const valid=Array.isArray(images)?images.filter(s=>typeof s==='string'&&s.trim()):[];
 const photos=valid.length?valid:['/images/property-placeholder.jpg'];
 const [index,setIndex]=useState(0);
 const [failed,setFailed]=useState<Record<number,boolean>>({});
 const move=(step:number)=>setIndex(i=>(i+step+photos.length)%photos.length);
 return <section aria-label="Property photographs" className="mb-10 sm:mb-14">
  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eaece2] sm:aspect-[16/9] lg:aspect-[2.1]">
   <img key={index} src={failed[index]?'/images/property-placeholder.jpg':photos[index]} alt={valid.length&&!failed[index]?title+' — photo '+(index+1):'Property photo unavailable'} className="h-full w-full object-cover" onError={()=>setFailed(old=>({...old,[index]:true}))}/>
   {photos.length>1&&<><button type="button" aria-label="Previous photo" onClick={()=>move(-1)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#243b31]"><ChevronLeft/></button><button type="button" aria-label="Next photo" onClick={()=>move(1)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#243b31]"><ChevronRight/></button></>}
   <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs text-white"><Images size={15}/>{valid.length?index+1+' / '+photos.length:'No photo'}</span>
  </div>
  {photos.length>1&&<div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Choose photo">{photos.map((photo,i)=><button key={i} type="button" aria-label={'Show photo '+(i+1)} aria-pressed={i===index} onClick={()=>setIndex(i)} className={'h-[64px] w-[88px] shrink-0 overflow-hidden rounded-lg border-2 '+(i===index?'border-[#243b31]':'border-transparent')}><img src={failed[i]?'/images/property-placeholder.jpg':photo} alt="" loading="lazy" onError={()=>setFailed(old=>({...old,[i]:true}))} className="h-full w-full object-cover"/></button>)}</div>}
 </section>;
}
