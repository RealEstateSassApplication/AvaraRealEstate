import {NextRequest,NextResponse} from 'next/server';
import {requireAuth} from '@/lib/auth';
import RentalRequest from '@/models/RentalRequest';
import '@/models/Property';
import {findMatchingProperties} from '@/lib/matchRentalRequests';
import {rentalInput} from '@/lib/rental-input';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
function failure(e:unknown){return NextResponse.json({error:e instanceof Error&&e.message==='Authentication required'?'Authentication required':'Rental requests unavailable'},{status:e instanceof Error&&e.message==='Authentication required'?401:500,headers});}
export async function POST(request:NextRequest){
 try{const user=await requireAuth(request);const parsed=rentalInput.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Check property type, location, budget and dates.'},{status:400,headers});
 const count=await RentalRequest.countDocuments({user:user._id,status:{$in:['active','matched']}});if(count>=10)return NextResponse.json({error:'Close an existing request before creating another.'},{status:409,headers});
 const row=await RentalRequest.create({...parsed.data,user:user._id,status:'active',moveInDate:parsed.data.moveInDate?new Date(parsed.data.moveInDate):undefined});
 let matchedCount=0;
 try{const matches=await findMatchingProperties(row);matchedCount=matches.length;await RentalRequest.updateOne({_id:row._id,status:'active'},{$set:{matchedProperties:matches.map(m=>m.property._id),status:matchedCount?'matched':'active'}});}catch{ /* request is saved; matches can be refreshed */ }
 return NextResponse.json({data:{_id:row._id},matchedCount,message:'Rental request created'},{status:201,headers});
 }catch(e){return failure(e);}
}
export async function GET(request:NextRequest){
 try{const user=await requireAuth(request);const status=request.nextUrl.searchParams.get('status');const q:any={user:user._id};if(status&&['active','matched','fulfilled','cancelled'].includes(status))q.status=status;
 const data=await RentalRequest.find(q).sort({createdAt:-1}).limit(100).populate({path:'matchedProperties',match:{status:'active'},select:'title price currency rentFrequency purpose images address.city address.district type bedrooms bathrooms areaSqft amenities'}).populate({path:'offers.property',match:{status:'active'},select:'title price currency rentFrequency purpose images address.city address.district type'}).select('-offers.sender').lean();
 return NextResponse.json({data},{headers});
 }catch(e){return failure(e);}
}
