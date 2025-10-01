import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
  const { name, email, phone, password, role, skipPassword } = await request.json();
    
    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) {
      // If skipPassword is true (tenant creation), return existing user
      if (skipPassword) {
        return NextResponse.json({ user: { _id: existing._id, name: existing.name, email: existing.email, phone: existing.phone, role: existing.role } }, { status: 200 });
      }
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    
    // For skipPassword (tenant creation), generate a temporary password
    const finalPassword = skipPassword ? `temp_${Math.random().toString(36).slice(2)}` : password;
    if (!name || !email || !phone || !finalPassword) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    
    const passwordHash = await hashPassword(finalPassword);
  const requestedRole = typeof role === 'string' ? role : undefined;
  const roleToSet = requestedRole === 'host' ? 'host' : 'user';
  const rolesToSet = requestedRole === 'host' ? ['host'] : ['user'];
  const user = await User.create({ name, email: email.toLowerCase(), phone, passwordHash, role: roleToSet, roles: rolesToSet, verified: false, emailVerified: false, phoneVerified: false });
    
    // If skipPassword (tenant creation), return user without token
    if (skipPassword) {
      return NextResponse.json({ user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, message: 'User created' }, { status: 201 });
    }
    
    const token = generateToken(user._id.toString());
  const res = NextResponse.json({ data: { id: user._id, name: user.name, email: user.email, roles: user.roles || [user.role] }, message: 'User created' }, { status: 201 });
    res.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}