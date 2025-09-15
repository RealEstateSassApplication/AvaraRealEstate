import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Rejected by admin';
    const property = await Property.findByIdAndUpdate(params.id, { status: 'rejected' }, { new: true });
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ property, message: 'Property rejected', reason });
  } catch (err: any) {
    console.error('Reject property error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
