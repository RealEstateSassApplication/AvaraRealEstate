import { NextRequest, NextResponse } from 'next/server';
import PropertyService from '@/services/propertyService';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Property from '@/models/Property';
import { Types } from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({error:'Sign in required'}, {status:401});
    const userId = (user as any)._id?.toString();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fav = await PropertyService.toggleFavorite(userId, params.id);
    return NextResponse.json({ favorite: fav });
  } catch (err: any) {
    console.error('Toggle favorite error:', err);
    return NextResponse.json({ error: 'Could not update favorite' }, { status: 500 });
  }
}

// Explicit desired state is safe to retry; legacy POST retained for existing clients.
export async function PATCH(request: NextRequest,{params}:{params:{id:string}}){
 try{
  const user=await getUserFromRequest(request);
  if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
  if(!Types.ObjectId.isValid(params.id))return NextResponse.json({error:'Invalid property'},{status:400});
  const body=await request.json().catch(()=>null);
  if(!body||typeof body.favorite!=='boolean')return NextResponse.json({error:'Invalid favorite state'},{status:400});
  const id=new Types.ObjectId(params.id);
  if(body.favorite&&!await Property.exists({_id:id,status:'active'}))return NextResponse.json({error:'Property not available'},{status:404});
  await User.updateOne({_id:user._id},body.favorite?{$addToSet:{favorites:id}}:{$pull:{favorites:id}});
  return NextResponse.json({favorite:body.favorite},{headers:{'Cache-Control':'private, no-store'}});
 }catch{ return NextResponse.json({error:'Could not update favorite'},{status:500}); }
}
