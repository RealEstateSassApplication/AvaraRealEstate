import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import BookingService, { CreateBookingInput } from '@/services/bookingService';
import { requireAuth } from '@/lib/auth';
import { parsePositiveInt } from '@/lib/security';

interface UserLike {
  _id: string | { toString(): string };
  role?: string;
  roles?: string[];
}

const bookingSchema = z.object({
  propertyId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  guestCount: z.number().int().min(1).max(50),
  guestDetails: z.object({
    adults: z.number().int().min(1).max(50),
    children: z.number().int().min(0).max(50),
  }),
  specialRequests: z.string().trim().max(2000).optional(),
});

function rolesFor(user: UserLike) {
  return Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request) as unknown as UserLike;
    const body = await request.json();

    const guestCount = Math.max(1, Math.floor(Number(body.guestCount ?? body.numberOfGuests ?? 1)));
    const normalized = {
      propertyId: String(body.propertyId || ''),
      startDate: String(body.startDate || body.checkInDate || ''),
      endDate: String(body.endDate || body.checkOutDate || ''),
      guestCount,
      guestDetails: {
        adults: Math.max(1, Math.floor(Number(body.guestDetails?.adults ?? guestCount))),
        children: Math.max(0, Math.floor(Number(body.guestDetails?.children ?? 0))),
      },
      specialRequests: body.specialRequests ? String(body.specialRequests) : undefined,
    };

    const parsed = bookingSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid booking details', reason: 'invalid_request' },
        { status: 400 }
      );
    }

    const input: CreateBookingInput = {
      ...parsed.data,
      userId: user._id.toString(),
    };

    try {
      // Pricing is intentionally not accepted from the request. The service
      // calculates the amount from the property and selected dates.
      const result = await BookingService.createBooking(input);
      return NextResponse.json({ message: 'Booking created', data: result }, { status: 201 });
    } catch (serviceErr: any) {
      const msg = serviceErr?.message || 'Unable to create booking';
      let reason = 'unknown';
      if (msg.includes('Property not found')) reason = 'not_found';
      else if (msg.includes('selected dates')) reason = 'dates_conflict';
      else if (msg.includes('Property not available')) reason = 'inactive';
      else if (msg.includes('Invalid dates')) reason = 'invalid_dates';

      console.error('Booking service error:', msg);
      return NextResponse.json({ error: msg, reason }, { status: 400 });
    }
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required', reason: 'unauthenticated' },
        { status: 401 }
      );
    }
    console.error('Booking POST error:', err);
    return NextResponse.json({ error: 'Internal server error', reason: 'server_error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request) as unknown as UserLike;
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1, 100000);
    const limit = parsePositiveInt(searchParams.get('limit'), 10, 100);
    const type = searchParams.get('type');

    if (type === 'host') {
      const roles = rolesFor(user);
      if (!roles.some((role) => ['host', 'admin', 'super-admin'].includes(role))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json(await BookingService.getBookingsByHost(user._id.toString(), page, limit));
    }

    return NextResponse.json(await BookingService.getBookingsByUser(user._id.toString(), page, limit));
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Booking GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
