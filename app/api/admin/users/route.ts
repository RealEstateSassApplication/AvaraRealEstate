import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { parsePositiveInt } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInt(searchParams.get('limit'), 20, 100);

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email phone role roles verified listings createdAt');

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
