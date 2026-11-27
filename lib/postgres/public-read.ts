import 'server-only';
import {publicBase} from '@/lib/discovery/collections';
import {types,districts} from '@/lib/discovery/studios';
export const postgresPreview=()=>process.env.AVARA_PUBLIC_CATALOG==='postgres-preview'&&process.env.VERCEL_ENV!=='production';
export const propertyIdValid=(id:string)=>/^(?:[a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(id);
type Filter={purpose?:string;type?:string|string[];city?:string;district?:string;province?:string;minPrice?:number;maxPrice?:number;bedrooms?:number;bathrooms?:number;amenities?:string|string[];search?:string;verified?:boolean;featured?:boolean;currency?:string;period?:string;ids?:string[];lat?:number;lng?:number;radius?:number};
type Row={id:string;title:string;description:string;property_type:string;purpose:'rent'|'sale'|'booking';status:string;price:number;currency:string;rent_period?:'monthly'|'weekly'|'daily'|null;city:string;district:string;bedrooms?:number|null;bathrooms?:number|null;area_sqft?:number|null;images:string[];amenities:string[];verified:boolean;created_at:string;updated_at:string};
const columns='id,title,description,property_type,purpose,status,price,currency,rent_period,city,district,bedrooms,bathrooms,area_sqft,images,amenities,verified,created_at,updated_at';
const provinces:Record<string,string[]>={Western:['Colombo','Gampaha','Kalutara'],Central:['Kandy','Matale','Nuwara Eliya'],Southern:['Galle','Matara','Hambantota'],Northern:['Jaffna','Kilinochchi','Mannar','Mullaitivu','Vavuniya'],Eastern:['Trincomalee','Batticaloa','Ampara'],'North Western':['Puttalam','Kurunegala'],'North Central':['Anuradhapura','Polonnaruwa'],Uva:['Badulla','Monaragala'],Sabaragamuwa:['Ratnapura','Kegalle']};
const array=(v?:string|string[])=>typeof v==='string'?[v]:v||[];
const quote=(s:string)=>'"'+s.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
const safeText=(s:string)=>s.length<=200&&/^[\p{L}\p{M}\p{N} .,'()-]+$/u.test(s);
const empty=()=>({rows:[] as Row[],total:0});
export async function readPublicRows(f:Filter={},limit=20,page=1){
 if(!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(page)||page<1||page>1000)throw Error('Invalid pagination');
 if(f.featured||f.lat!==undefined||f.lng!==undefined||f.radius!==undefined)return empty(); // not represented in the new schema
 const base=new URL(process.env.SUPABASE_URL||'');const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
 if(base.protocol!=='https:'||base.username||base.password||!key)throw Error('Catalog configuration unavailable');
 const url=new URL('/rest/v1/avara_properties',base);const p=url.searchParams;p.set('select',columns);p.set('status','eq.active');p.set('order','created_at.desc,id.desc');p.set('limit',String(limit));p.set('offset',String((page-1)*limit));
 if(f.purpose){if(!['rent','sale','booking'].includes(f.purpose))return empty();p.set('purpose','eq.'+f.purpose);}
 const ts=array(f.type);if(ts.length){if(ts.some(t=>!types.includes(t)))return empty();p.set('property_type','in.('+ts.map(quote).join(',')+')');}
 if(f.city){if(!safeText(f.city))return empty();p.set('city','ilike.'+f.city);}
 if(f.district){if(!safeText(f.district))return empty();p.set('district','ilike.'+f.district);}
 if(f.province){const ds=provinces[f.province];if(!ds)return empty();p.append('district','in.('+ds.map(quote).join(',')+')');}
 if(f.search){if(!safeText(f.search))return empty();p.set('or','(title.ilike.'+quote('*'+f.search+'*')+',description.ilike.'+quote('*'+f.search+'*')+')');}
 if(f.ids){if(!f.ids.length||f.ids.some(id=>!propertyIdValid(id)))return empty();p.set('id','in.('+f.ids.map(quote).join(',')+')');}
 if(f.verified)p.set('verified','eq.true');
 const am=array(f.amenities);if(am.length){if(am.some(a=>!safeText(a)))return empty();p.set('amenities','cs.{'+am.map(quote).join(',')+'}');}
 if(f.currency||f.minPrice!==undefined||f.maxPrice!==undefined){const currency=f.currency||'LKR';if(!['LKR','USD'].includes(currency))return empty();p.set('currency','eq.'+currency);}
 if(f.period){if(!['monthly','weekly','daily'].includes(f.period)||f.purpose==='sale')return empty();p.set('rent_period','eq.'+f.period);}
 for(const [col,op,n] of [['price','gte',f.minPrice],['price','lte',f.maxPrice],['bedrooms','gte',f.bedrooms],['bathrooms','gte',f.bathrooms]] as const){if(n!==undefined){if(!Number.isFinite(n)||n<0||n>1e12)return empty();p.append(col,op+'.'+n);}}
 if(f.minPrice!==undefined&&f.maxPrice!==undefined&&f.minPrice>f.maxPrice)return empty();
 const response=await fetch(url,{headers:{apikey:key,Accept:'application/json',Prefer:'count=exact'},cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Public catalog unavailable');const rows=await response.json() as Row[];const count=response.headers.get('content-range')?.split('/').pop();if(!Array.isArray(rows)||count===undefined||!/^\d+$/.test(count))throw Error('Invalid catalog response');return {rows,total:Number(count)};
}
export function cardRow(r:Row){return {_id:r.id,title:r.title,description:r.description,type:r.property_type,purpose:r.purpose,status:r.status,price:Number(r.price),currency:r.currency,rentFrequency:r.rent_period||undefined,bedrooms:r.bedrooms??undefined,bathrooms:r.bathrooms??undefined,areaSqft:r.area_sqft==null?undefined:Number(r.area_sqft),images:r.images||[],address:{city:r.city,district:r.district,country:'Sri Lanka'},amenities:r.amenities||[],ratings:{average:0,count:0},featured:false,verified:r.verified,owner:undefined,createdAt:new Date(r.created_at),updatedAt:new Date(r.updated_at)};}
export function agentRow(r:Row){return {id:r.id,url:publicBase()+'/listings/'+r.id,title:r.title,type:r.property_type,purpose:r.purpose,city:r.city,district:r.district,price:Number(r.price),currency:r.currency,period:r.rent_period||undefined,bedrooms:r.bedrooms??undefined,bathrooms:r.bathrooms??undefined,areaSqft:r.area_sqft==null?undefined:Number(r.area_sqft),image:r.images?.[0],updatedAt:r.updated_at};}
export function studioRow(r:Row){const {url,updatedAt,...rest}=agentRow(r);return {...rest,amenities:r.amenities||[],verified:r.verified,createdAt:r.created_at};}
export async function postgresDetail(id:string){if(!propertyIdValid(id))return null;const result=await readPublicRows({ids:[id]},1);return result.rows.length?cardRow(result.rows[0]):null;}
