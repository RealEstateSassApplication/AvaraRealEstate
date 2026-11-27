import 'server-only';import {NextResponse} from 'next/server';import dbConnect from '@/lib/db';import User,{type IUser} from '@/models/User';import {z} from 'zod';
export const supabaseMode=()=>process.env.AVARA_AUTH_PROVIDER==='supabase';
export const accessCookie='avara_sb_access';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type Identity={id:string;email?:string;email_confirmed_at?:string;user_metadata?:Record<string,unknown>};
type Session={access_token?:string;expires_in?:number;user?:Identity};
export class ProviderError extends Error{constructor(public status:number){super('Authentication service unavailable');}}
export async function provider<T>(path:string,method='GET',body?:unknown,access?:string):Promise<T>{
 const url=new URL(process.env.SUPABASE_URL||'');const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;if(!key||url.protocol!=='https:'||url.username||url.password)throw new ProviderError(503);
 const res=await fetch(url.origin+'/auth/v1/'+path,{method,headers:{apikey:key,'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:'no-store',signal:AbortSignal.timeout(10000)});if(!res.ok)throw new ProviderError(res.status);return await res.json().catch(()=>({})) as T;
}
const profile=z.object({name:z.string().trim().min(2).max(120),phone:z.string().trim().regex(/^\+?[0-9 ()-]{7,30}$/)});
export async function getProviderIdentity(access:string){const u=await provider<Identity>('user','GET',undefined,access);return typeof u.id==='string'&&uuid.test(u.id)&&typeof u.email==='string'&&u.email_confirmed_at?u:null;}
export async function existingProviderUser(access:string):Promise<IUser|null>{const identity=await getProviderIdentity(access);if(!identity)return null;await dbConnect();return await User.findOne({supabaseUserId:identity.id}).select('-passwordHash') as IUser|null;}
export async function provisionProviderUser(access:string):Promise<IUser|null>{const identity=await getProviderIdentity(access);if(!identity)return null;await dbConnect();const found=await User.findOne({supabaseUserId:identity.id}).select('-passwordHash');if(found)return found as IUser;const email=identity.email!.toLowerCase();const p=profile.safeParse(identity.user_metadata);if(!p.success)return null;
 // Do not attach an existing account merely because email or phone matches.
 if(await User.exists({$or:[{email},{phone:p.data.phone}]}))return null;
 try{return await User.create({supabaseUserId:identity.id,email,name:p.data.name,phone:p.data.phone,role:'user',roles:['user'],...(identity.user_metadata?.managerRequested===true?{managerRequestedAt:new Date()}:{}),emailVerified:true,phoneVerified:false,verified:false,preferences:{notifications:{email:false,sms:false,whatsapp:false}}}) as IUser;}catch(e){if((e as {code?:number}).code===11000)return await User.findOne({supabaseUserId:identity.id}).select('-passwordHash') as IUser|null;throw e;}
}
export function attachSession(res:NextResponse,s:Session){if(!s.access_token)throw new ProviderError(401);res.cookies.set(accessCookie,s.access_token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:Math.min(3600,Math.max(1,Number(s.expires_in)||3600))});res.cookies.set('token','',{path:'/',maxAge:0,httpOnly:true,secure:process.env.NODE_ENV==='production'});return res;}
export async function providerLogin(email:string,password:string){return provider<Session>('token?grant_type=password','POST',{email,password});}
export async function providerVerify(token_hash:string,type:'email'|'recovery'){return provider<Session>('verify','POST',{token_hash,type});}
export const privateHeaders={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
export function providerFailure(e:unknown){return NextResponse.json({error:e instanceof ProviderError&&[400,401,403,422].includes(e.status)?'Unable to authenticate or verify this request.':'Authentication service temporarily unavailable.'},{status:e instanceof ProviderError&&[400,401,403,422].includes(e.status)?400:e instanceof ProviderError&&e.status===429?429:503,headers:privateHeaders});}
