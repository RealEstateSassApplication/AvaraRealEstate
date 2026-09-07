import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Rent from '@/models/Rent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const propertyIds = await Property.find({ owner: user._id }).distinct('_id');
    const rents = await Rent.find({
      property: { $in: propertyIds },
      status: { $in: ['active', 'paused'] },
    })
      .sort({ status: 1, nextDue: 1 })
      .populate('tenant', 'name email phone verified emailVerified phoneVerified')
      .populate('property', 'title address images')
      .lean();

    const now = new Date();
    const tenants = (rents as any[]).map((rent) => ({
      rentId: String(rent._id),
      status: rent.status,
      tenant: rent.tenant,
      property: rent.property,
      amount: rent.amount,
      currency: rent.currency || 'LKR',
      frequency: rent.frequency,
      nextDue: rent.nextDue,
      overdue: rent.status === 'active' && new Date(rent.nextDue) < now,
      leaseStartDate: rent.leaseStartDate,
      leaseEndDate: rent.leaseEndDate,
      securityDeposit: rent.securityDeposit || 0,
      depositStatus: rent.depositStatus || 'not-required',
      totalPaid: rent.totalPaid || 0,
      paymentsCount: rent.paymentsCount || 0,
      lastPaidAt: rent.lastPaidAt,
    }));

    return NextResponse.json({ ok: true, data: tenants });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner tenants GET error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to load tenants' }, { status: 500 });
  }
}
