import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Number(searchParams.get('limit')) || 20;
    const query: any = {};
    if (status) query.status = status;
    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('owner', 'name email');
    return NextResponse.json({ properties });
  } catch (err: any) {
    console.error('Admin properties list error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
