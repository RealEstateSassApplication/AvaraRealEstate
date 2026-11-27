export type ListingFilters={search?:string;purpose?:'rent'|'sale'|'booking';type?:string[];minPrice?:number;maxPrice?:number;bedrooms?:number;bathrooms?:number;amenities?:string[];city?:string;district?:string;province?:string;featured?:boolean;verified?:boolean};
const strKeys=['search','city','district','province'] as const;
const nums=['minPrice','maxPrice','bedrooms','bathrooms'] as const;
const arrs=['type','amenities'] as const;
export function normalizeFilters(f:ListingFilters):ListingFilters{
 const result:ListingFilters={};
 if(f.purpose&&['rent','sale','booking'].includes(f.purpose))result.purpose=f.purpose;
 for(const k of strKeys){const v=f[k]?.trim().slice(0,k==='search'?200:120);if(v)result[k]=v;}
 for(const k of nums){const v=f[k];if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e12&&(!['bedrooms','bathrooms'].includes(k)||Number.isInteger(v)))result[k]=v;}
 if(result.minPrice!==undefined&&result.maxPrice!==undefined&&result.minPrice>result.maxPrice){delete result.minPrice;delete result.maxPrice;}
 for(const k of arrs){const v=Array.from(new Set((f[k]||[]).map(x=>x.trim().slice(0,100)).filter(Boolean))).slice(0,30);if(v.length)result[k]=v;}
 if(result.type?.length===1&&result.type[0]==='land'){delete result.bedrooms;delete result.bathrooms;}
 if(f.featured===true)result.featured=true;if(f.verified===true)result.verified=true;
 return result;
}
export function parseListingQuery(query:string){
 const p=new URLSearchParams(query);
 const f:ListingFilters={purpose:p.get('purpose') as ListingFilters['purpose'],featured:p.get('featured')==='true',verified:p.get('verified')==='true'};
 for(const k of strKeys)f[k]=p.get(k)||undefined;
 for(const k of nums){const v=p.get(k);if(v!==null&&v.trim()!=='')f[k]=Number(v);}
 for(const k of arrs)f[k]=p.getAll(k);
 const n=Number(p.get('page'));
 return {filters:normalizeFilters(f),page:Number.isInteger(n)&&n>0?Math.min(n,100000):1};
}
export function listingQuery(f:ListingFilters,page=1){
 const p=new URLSearchParams();for(const [k,v] of Object.entries(normalizeFilters(f))){if(Array.isArray(v))v.forEach(x=>p.append(k,x));else p.set(k,String(v));}if(page>1)p.set('page',String(page));return p.toString();
}
export function filterCount(f:ListingFilters){return Object.entries(normalizeFilters(f)).reduce((n,[k,v])=>n+(k==='purpose'?0:Array.isArray(v)?v.length:1),0);}
