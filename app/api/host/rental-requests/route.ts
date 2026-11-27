import {NextRequest,NextResponse} from 'next/server';
import {requireAuth} from '@/lib/auth';
import RentalRequest from '@/models/RentalRequest';
import Property from '@/models/Property';
import {checkPropertyMatch} from '@/lib/matchRentalRequests';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const headers={'Cache-Control':'private, no-store'};
 try{const user=await requireAuth(request);
 const properties=await Property.find({owner:user._id,status:'active',purpose:{$in:['rent','booking']}}).sort({createdAt:-1}).limit(100).lean();
 if(!properties.length)return NextResponse.json({data:[]},{headers});
 const rows=await RentalRequest.find({shareWithOwners:true,user:{$ne:user._id},status:{$in:['active','matched']},createdAt:{$gte:new Date(Date.now()-60*86400000)}}).sort({createdAt:-1}).limit(200).lean();
 const data=rows.flatMap(row=>{const matchingProperties=properties.map(p=>({propertyId:String(p._id),propertyTitle:p.title,...checkPropertyMatch(p,row),sent:row.offers?.some(o=>String(o.property)===String(p._id))||false})).filter(p=>p.matches).sort((a,b)=>b.score-a.score);
 if(!matchingProperties.length)return [];return [{_id:row._id,propertyTypes:row.propertyTypes,purpose:row.purpose,location:row.location,budget:row.budget,requirements:row.requirements,amenities:row.amenities,status:row.status,createdAt:row.createdAt,relevanceScore:matchingProperties[0].score,matchingPropertyCount:matchingProperties.length,matchingProperties}];});
 return NextResponse.json({data},{headers});
 }catch(e){return NextResponse.json({error:'Could not load opportunities'},{status:e instanceof Error&&e.message==='Authentication required'?401:500,headers});}
}
