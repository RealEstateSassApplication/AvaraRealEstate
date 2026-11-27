import {NextRequest,NextResponse} from 'next/server';
import {getUserFromRequest} from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const headers={'Cache-Control':'private, no-store'};
 const user=await getUserFromRequest(request);
 if(!user)return NextResponse.json({error:'Sign in required'},{status:401,headers});
 return NextResponse.json({ids:(user.favorites||[]).map(id=>String(id))},{headers});
}
