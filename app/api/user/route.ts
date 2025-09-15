import { NextRequest, NextResponse } from 'next/server';
import getUserFromReq, { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const allowed = ['name', 'phone', 'profilePhoto'];
    const updates: any = {};
    for (const key of allowed) {
      if (typeof body[key] !== 'undefined') updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    await dbConnect();
    const updated = await User.findByIdAndUpdate(user._id, updates, { new: true }).select('-passwordHash').lean();
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error('User PATCH error', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
