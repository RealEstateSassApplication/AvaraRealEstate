import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  password: z.string().min(8).max(128),
  role: z.enum(['user', 'host']).optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const requestedRole = parsed.data.role || 'user';

    const existing = await User.findOne({ $or: [{ email }, { phone }] }).select('_id');
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const roles = requestedRole === 'host' ? ['user', 'host'] : ['user'];
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: requestedRole,
      roles,
      verified: false,
      emailVerified: false,
      phoneVerified: false,
    });

    const token = generateToken(user._id.toString());
    const res = NextResponse.json(
      { data: { id: user._id, name: user.name, email: user.email, roles }, message: 'User created' },
      { status: 201 }
    );
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
