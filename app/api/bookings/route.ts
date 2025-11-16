import { NextRequest, NextResponse } from 'next/server';
import BookingService, { CreateBookingInput } from '@/services/bookingService';
import { requireAuth } from '@/lib/auth';

interface UserLike { _id: string | { toString(): string }; role?: string }

export async function POST(request: NextRequest) {
  try {
  const user = await requireAuth(request) as unknown as UserLike;
    const body = await request.json();
    
    // Support both old (startDate/endDate) and new (checkInDate/checkOutDate) field names
    const startDate = body.startDate || body.checkInDate;
    const endDate = body.endDate || body.checkOutDate;
    const guestCount = body.guestCount || body.numberOfGuests || 1;
    const totalAmount = body.totalAmount || body.totalPrice;
    
    const required = ['propertyId'];
    if (!body.propertyId) {
      return NextResponse.json({ error: 'Missing required field: propertyId', reason: 'missing_fields' }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields: check-in and check-out dates', reason: 'missing_fields' }, { status: 400 });
    }

    // Build guest details from individual fields or existing object
    const guestDetails = body.guestDetails || {
      name: body.guestName,
      email: body.guestEmail,
      phone: body.guestPhone,
    };

    const input: CreateBookingInput = {
      propertyId: body.propertyId,
  userId: (user._id as any).toString(),
      startDate,
      endDate,
      guestCount,
      totalAmount,
      guestDetails,
      specialRequests: body.specialRequests,
      currency: body.currency || 'LKR',
      provider: body.provider,
      providerTransactionId: body.providerTransactionId
    };

    // Double-check availability (service will also validate again)
    const available = await BookingService.checkAvailability(input.propertyId, input.startDate, input.endDate);
    if (!available) return NextResponse.json({ error: 'Not available for selected dates', reason: 'dates_conflict' }, { status: 400 });

    try {
      const result = await BookingService.createBooking(input);
      return NextResponse.json({ message: 'Booking created', data: result }, { status: 201 });
    } catch (serviceErr: any) {
      // Map service-level errors to structured reasons
      const msg = (serviceErr && serviceErr.message) ? serviceErr.message : 'Internal server error';
      let reason = 'unknown';
      if (msg.includes('Property not found')) reason = 'not_found';
      else if (msg.includes('Property not available for selected dates')) reason = 'dates_conflict';
      else if (msg.includes('Property not available')) reason = 'inactive';
      else if (msg.includes('Invalid dates')) reason = 'invalid_dates';

      console.error('Booking Service error:', msg);
      return NextResponse.json({ error: msg, reason }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Booking POST error:', err);
    // Authentication errors thrown by requireAuth may end up here
    if (err?.message && err.message.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({ error: 'Authentication required', reason: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal server error', reason: 'server_error' }, { status: 500 });
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