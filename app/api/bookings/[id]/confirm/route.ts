import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import BookingService from '@/services/bookingService';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';

function rolesFor(user: any): string[] {
  return Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const roles = rolesFor(user);
    const isAdmin = roles.includes('admin') || roles.includes('super-admin');
    const isHost = roles.includes('host');
    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const existing = await Booking.findById(params.id).select('host status paymentStatus');
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!isAdmin && existing.host.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existing.status === 'cancelled' || existing.status === 'completed') {
      return NextResponse.json({ error: `Cannot confirm a ${existing.status} booking` }, { status: 409 });
    }

    // Host confirmation changes the reservation state only. Payment status can
    // become paid only from a verified payment callback or an admin payment flow.
    const booking = await BookingService.confirmBooking(params.id, {
      markPaid: existing.paymentStatus === 'paid',
    });
    return NextResponse.json({ booking, message: 'Booking confirmed' });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Confirm booking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
