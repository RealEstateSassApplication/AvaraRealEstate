import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import RentPayment from '@/models/RentPayment';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await dbConnect();
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const rentId = url.searchParams.get('rentId');
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));

    const query: any = { host: user._id, status: 'paid' };
    if (propertyId) query.property = propertyId;
    if (rentId) query.rent = rentId;

    const payments = await RentPayment.find(query)
      .sort({ paidAt: -1 })
      .limit(limit)
      .populate('property', 'title address images')
      .populate('tenant', 'name email phone')
      .populate('recordedBy', 'name')
      .lean();

    return NextResponse.json({ ok: true, data: payments });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner payments GET error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to load payment history' }, { status: 500 });
  }
}
