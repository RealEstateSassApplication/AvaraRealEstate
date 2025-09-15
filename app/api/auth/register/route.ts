import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
  const { name, email, phone, password, role = 'tenant' } = await request.json();
    if (!name || !email || !phone || !password) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    const passwordHash = await hashPassword(password);
  const rolesToSet = Array.isArray(role) ? role : [role];
  const user = await User.create({ name, email: email.toLowerCase(), phone, passwordHash, role, roles: rolesToSet, verified: false, emailVerified: false, phoneVerified: false });
    const token = generateToken(user._id.toString());
  const res = NextResponse.json({ data: { id: user._id, name: user.name, email: user.email, roles: user.roles || [user.role] }, message: 'User created' }, { status: 201 });
    res.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}