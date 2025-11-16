import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';

// GET /api/properties/[id]/availability - Get blocked/booked dates
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const propertyId = params.id;

    // Get all confirmed bookings for this property
    const bookings = await Booking.find({
      property: propertyId,
      status: { $in: ['confirmed', 'pending'] },
    }).select('checkInDate checkOutDate');

    // Convert bookings to array of blocked dates
    const blockedDates: string[] = [];
    
    bookings.forEach((booking) => {
      const startDate = new Date(booking.checkInDate);
      const endDate = new Date(booking.checkOutDate);
      
      // Add all dates between check-in and check-out (inclusive)
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        blockedDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return NextResponse.json({
      blockedDates: Array.from(new Set(blockedDates)), // Remove duplicates
      bookingCount: bookings.length,
    });
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
