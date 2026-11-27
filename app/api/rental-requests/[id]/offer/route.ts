import {NextRequest,NextResponse} from 'next/server';
import {Types} from 'mongoose';
import {requireAuth} from '@/lib/auth';
import RentalRequest from '@/models/RentalRequest';
import Property from '@/models/Property';
import Notification from '@/models/Notification';
import {checkPropertyMatch} from '@/lib/matchRentalRequests';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest,{params}:{params:{id:string}}){
 try{const user=await requireAuth(request);const body=await request.json().catch(()=>null);if(!Types.ObjectId.isValid(params.id)||typeof body?.propertyId!=='string'||!Types.ObjectId.isValid(body.propertyId))return NextResponse.json({error:'Invalid request or property'},{status:400});
 const property=await Property.findOne({_id:body.propertyId,owner:user._id,status:'active'}).lean();
 const query={_id:params.id,shareWithOwners:true,user:{$ne:user._id},status:{$in:['active','matched']},createdAt:{$gte:new Date(Date.now()-60*86400000)}};
 const row=await RentalRequest.findOne(query);if(!row||!property||!checkPropertyMatch(property,row).matches)return NextResponse.json({error:'This opportunity or property is no longer eligible'},{status:404});
 const result=await RentalRequest.updateOne({...query,updatedAt:row.updatedAt,'offers.property':{$ne:property._id},'offers.49':{$exists:false}},{$push:{offers:{property:property._id,sender:user._id,createdAt:new Date()}}});
 if(!result.modifiedCount)return NextResponse.json({error:'Already offered or request has reached its response limit'},{status:409});
 try{await Notification.create({user:row.user,type:'rental_property_offer',message:'A property owner has responded to your rental request.',metadata:{rentalRequestId:row._id,propertyId:property._id}});}catch{}
 return NextResponse.json({success:true},{status:201});
 }catch(e){return NextResponse.json({error:'Could not send offer'},{status:e instanceof Error&&e.message==='Authentication required'?401:500});}
}
