import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/bookingService';

export async function POST(request: NextRequest) {
  try {
    const { propertyId, startDate, endDate } = await request.json();

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Property ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    const isAvailable = await BookingService.checkAvailability(
      propertyId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ available: isAvailable });

  } catch (error: any) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}