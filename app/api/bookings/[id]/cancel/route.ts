import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import BookingService from '@/services/bookingService';

function rolesFor(user: any): string[] {
  return Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : ['user']);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 1000) : undefined;
    const roles = rolesFor(user);

    const cancelled = await BookingService.cancelBookingByActor(
      params.id,
      user._id.toString(),
      roles,
      reason || 'Cancelled by user'
    );

    if (!cancelled) {
      return NextResponse.json({ error: 'Booking not found or not permitted' }, { status: 404 });
    }
    return NextResponse.json({ booking: cancelled, message: 'Booking cancelled' });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (err?.message?.includes('refund workflow') || err?.message?.includes('Completed bookings')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error('Cancel booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
