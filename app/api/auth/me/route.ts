import { NextRequest, NextResponse } from 'next/server';
import getUserFromReq from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const roles = Array.isArray((user as any).roles) ? (user as any).roles : (user.role ? [user.role] : ['user']);
    // compute listings count from Property collection to ensure accuracy
    await dbConnect();
    const listingsCount = await Property.countDocuments({ owner: user._id });

    // Return multiple common shapes so callers in the app can consume user id/name reliably.
    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      roles,
      listingsCount,
      profilePhoto: (user as any).profilePhoto
    };

    return NextResponse.json({ ok: true, user: safeUser, data: safeUser, _id: user._id });
  } catch (err: any) {
    console.error('Auth me error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}