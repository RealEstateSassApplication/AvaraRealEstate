import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import BookingService from '@/services/bookingService';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const reason = body.reason;
    // Only the booking user, host, or admin can cancel
    if (!['admin', 'super-admin', 'host', 'tenant', 'guest'].includes((user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const cancelled = await BookingService.cancelBooking(params.id, (user as any)._id.toString(), reason);
    if (!cancelled) return NextResponse.json({ error: 'Not found or not permitted' }, { status: 404 });
    return NextResponse.json({ booking: cancelled, message: 'Booking cancelled' });
  } catch (err: any) {
    console.error('Cancel booking error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
