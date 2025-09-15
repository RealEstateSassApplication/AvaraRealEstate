import { NextRequest, NextResponse } from 'next/server';
import getUserFromReq from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const u = await User.findById(user._id);
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // set legacy role and ensure roles array contains 'host'
    u.role = 'host';
    const roles = Array.isArray(u.roles) ? u.roles.slice() : [];
    if (!roles.includes('host')) roles.push('host');
    u.roles = roles;
    await u.save();

    const listingsCount = Array.isArray((u as any).listings) ? (u as any).listings.length : 0;
    return NextResponse.json({ data: { id: u._id, name: u.name, email: u.email, roles: u.roles, role: u.role, listingsCount } });
  } catch (err: any) {
    console.error('Promote to host error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
