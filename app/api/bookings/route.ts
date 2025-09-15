import { NextRequest, NextResponse } from 'next/server';
import BookingService, { CreateBookingInput } from '@/services/bookingService';
import { requireAuth } from '@/lib/auth';

interface UserLike { _id: string | { toString(): string }; role?: string }

export async function POST(request: NextRequest) {
  try {
  const user = await requireAuth(request) as unknown as UserLike;
    const body = await request.json();
    const required = ['propertyId', 'startDate', 'endDate'];
    const missing = required.filter(f => !body[f]);
    if (missing.length) return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });

    const input: CreateBookingInput = {
      propertyId: body.propertyId,
  userId: (user._id as any).toString(),
      startDate: body.startDate,
      endDate: body.endDate,
      guestCount: body.guestCount || 1,
      totalAmount: body.totalAmount,
      guestDetails: body.guestDetails,
      specialRequests: body.specialRequests,
      currency: body.currency,
      provider: body.provider,
      providerTransactionId: body.providerTransactionId
    };

    const available = await BookingService.checkAvailability(input.propertyId, input.startDate, input.endDate);
    if (!available) return NextResponse.json({ error: 'Not available for selected dates' }, { status: 400 });

    const result = await BookingService.createBooking(input);
    return NextResponse.json({ message: 'Booking created', data: result }, { status: 201 });
  } catch (err: any) {
    console.error('Booking POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
  const user = await requireAuth(request) as unknown as UserLike;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const type = searchParams.get('type');
    const result = type === 'host'
  ? await BookingService.getBookingsByHost((user._id as any).toString(), page, limit)
  : await BookingService.getBookingsByUser((user._id as any).toString(), page, limit);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Booking GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}