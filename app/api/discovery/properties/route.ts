import {NextRequest,NextResponse} from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import {Types} from 'mongoose';
import {approximateCoordinates,validIds,types,districts,type StudioProperty} from '@/lib/discovery/studios';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{
 const p=req.nextUrl.searchParams,ids=validIds(p.get('ids')||''),q:Record<string,unknown>={status:'active'};
 if(p.has('ids')){if(!ids.length)return NextResponse.json({properties:[]});q._id={$in:ids.map(id=>new Types.ObjectId(id))};}
 else{const type=p.get('type'),purpose=p.get('purpose'),district=p.get('district'),city=p.get('city')?.trim().slice(0,80);if(type&&types.includes(type))q.type=type;if(purpose&&['rent','sale','booking'].includes(purpose))q.purpose=purpose;if(district&&districts.includes(district))q['address.district']=district;if(city)q['address.city']=new RegExp('^'+city.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i');const max=Number(p.get('maxPrice'));if(max>0&&max<=1e12){q.price={$lte:max};q.currency="LKR";}}
 await dbConnect();const rows=await Property.find(q).select('title type purpose price currency rentFrequency address.city address.district bedrooms bathrooms areaSqft amenities verified images location.coordinates createdAt').sort({createdAt:-1,_id:-1}).limit(ids.length||100).lean();
 const properties:StudioProperty[]=rows.map(x=>({id:String(x._id),title:x.title,type:x.type,purpose:x.purpose,price:x.price,currency:x.currency||'LKR',period:x.rentFrequency,city:x.address?.city||'',district:x.address?.district||'',bedrooms:x.bedrooms,bathrooms:x.bathrooms,areaSqft:x.areaSqft,amenities:x.amenities||[],verified:x.verified===true,image:x.images?.[0],coordinates:approximateCoordinates(x.location?.coordinates),createdAt:x.createdAt?.toISOString()}));
 return NextResponse.json({properties,limit:ids.length||100},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Property discovery unavailable'},{status:503});}}
