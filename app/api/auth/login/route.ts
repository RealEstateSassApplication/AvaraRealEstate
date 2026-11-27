import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {z} from 'zod';
import {supabaseMode,providerLogin,provisionProviderUser,attachSession,providerFailure,privateHeaders} from '@/lib/supabase-auth';
import { verifyPassword, generateToken } from '@/lib/auth';

function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseCredentials(body: any) {
  const emailOrPhone = body.emailOrPhone ?? body.email ?? body.phone;
  const password = body.password;
  return { emailOrPhone, password };
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { emailOrPhone, password } = parseCredentials(body);
    if(typeof emailOrPhone!=='string'||typeof password!=='string'||emailOrPhone.length>254||password.length>128)return errorJson('Invalid credentials',400);
    if(supabaseMode()){try{if(!z.string().email().safeParse(emailOrPhone).success)return errorJson('Use your email address',400);const session=await providerLogin(emailOrPhone.toLowerCase(),password);const user=session.access_token?await provisionProviderUser(session.access_token):null;if(!user)return errorJson('Verify your email or contact support to migrate an existing account.',403);return attachSession(NextResponse.json({data:{id:user._id,name:user.name,role:user.role,roles:user.roles},message:'Login successful'},{headers:privateHeaders}),session);}catch(e){return providerFailure(e);}}
    if (!emailOrPhone || !password) return errorJson('Missing fields', 400);

    const query = { $or: [{ email: (emailOrPhone as string).toLowerCase() }, { phone: emailOrPhone }] };
    const user = await User.findOne(query);
    if (!user || !user.passwordHash) return errorJson('Invalid credentials', 401);

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return errorJson('Invalid credentials', 401);

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const token = generateToken(user._id.toString());

  const roles = Array.isArray((user as any).roles) ? (user as any).roles : (user.role ? [user.role] : ['user']);

  const res = NextResponse.json({ data: { id: user._id, name: user.name, email: user.email, role:user.role, roles }, message: 'Login successful' });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return errorJson(err.message || 'Internal server error', 500);
  }
}