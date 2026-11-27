import {NextRequest,NextResponse} from 'next/server';
import {Types} from 'mongoose';
import {requireAuth} from '@/lib/auth';
import RentalRequest from '@/models/RentalRequest';
import {findMatchingProperties} from '@/lib/matchRentalRequests';
import {z} from 'zod';
import '@/models/Property';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
const error=(e:unknown)=>e instanceof Error&&e.message==='Authentication required'?fail('Authentication required',401):fail('Request unavailable',500);
const update=z.object({status:z.enum(['fulfilled','cancelled']).optional(),shareWithOwners:z.boolean().optional(),refresh:z.boolean().optional()}).strict();
type Params={params:{id:string}};
export async function GET(req:NextRequest,{params}:Params){try{const u=await requireAuth(req);if(!Types.ObjectId.isValid(params.id))return fail('Not found',404);const row=await RentalRequest.findOne({_id:params.id,user:u._id}).populate({path:'matchedProperties',match:{status:'active'},select:'title price currency rentFrequency purpose images address.city address.district type bedrooms bathrooms areaSqft amenities'}).populate({path:'offers.property',match:{status:'active'},select:'title price currency rentFrequency purpose images address.city address.district type'}).select('-offers.sender').lean();return row?NextResponse.json({data:row},{headers}):fail('Not found',404);}catch(e){return error(e);}}
export async function PATCH(req:NextRequest,{params}:Params){try{const u=await requireAuth(req);if(!Types.ObjectId.isValid(params.id))return fail('Not found',404);const p=update.safeParse(await req.json().catch(()=>null));if(!p.success)return fail('Invalid request update',400);
 const q={_id:params.id,user:u._id,status:{$in:['active','matched']}};const row=await RentalRequest.findOne(q);if(!row)return fail('Active request not found',404);
 const changes:Record<string,unknown>={};if(p.data.status)changes.status=p.data.status;if(p.data.shareWithOwners!==undefined)changes.shareWithOwners=p.data.shareWithOwners;
 if(p.data.refresh&&!p.data.status){const matches=await findMatchingProperties(row);changes.matchedProperties=matches.map(m=>m.property._id);changes.status=matches.length?'matched':'active';}
 if(Object.keys(changes).length)await RentalRequest.updateOne(q,{$set:changes});
 return NextResponse.json({success:true},{headers});}catch(e){return error(e);}}
export async function DELETE(req:NextRequest,{params}:Params){try{const u=await requireAuth(req);if(!Types.ObjectId.isValid(params.id))return fail('Not found',404);const result=await RentalRequest.updateOne({_id:params.id,user:u._id,status:{$in:['active','matched']}},{$set:{status:'cancelled',shareWithOwners:false}});return result.matchedCount?NextResponse.json({success:true},{headers}):fail('Active request not found',404);}catch(e){return error(e);}}
