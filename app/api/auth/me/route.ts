import { NextRequest, NextResponse } from 'next/server';
import getUserFromReq from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Get the single role field
    const role = (user as any).role || 'user';
    
    // Build roles array - include both roles array and single role field
    let roles: string[] = [];
    if (Array.isArray((user as any).roles) && (user as any).roles.length > 0) {
      roles = (user as any).roles;
    } else if (role) {
      roles = [role];
    } else {
      roles = ['user'];
    }
    
    // compute listings count from Property collection to ensure accuracy
    await dbConnect();
    const listingsCount = await Property.countDocuments({ owner: user._id });

    // Return multiple common shapes so callers in the app can consume user id/name reliably.
    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role,  // Include single role field
      roles, // Include roles array
      listingsCount,
      profilePhoto: (user as any).profilePhoto
    };

    return NextResponse.json({ ok: true, user: safeUser, data: safeUser, _id: user._id });
  } catch (err: any) {
    console.error('Auth me error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}