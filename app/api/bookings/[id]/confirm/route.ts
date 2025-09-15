import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import BookingService from '@/services/bookingService';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (!['admin', 'super-admin', 'host'].includes((user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const booking = await BookingService.confirmBooking(params.id);
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ booking, message: 'Booking confirmed' });
  } catch (err: any) {
    console.error('Confirm booking error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
