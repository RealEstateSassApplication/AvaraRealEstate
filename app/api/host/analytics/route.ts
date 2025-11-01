import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import Rent from '@/models/Rent';
import getUserFromReq from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromReq(request as any);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days')) || 30;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get host's properties
    const properties = await Property.find({ owner: user._id });
    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        analytics: {
          totalEarnings: 0,
          monthlyEarnings: 0,
          totalBookings: 0,
          activeBookings: 0,
          totalProperties: 0,
          occupancyRate: 0,
          averageRating: 0,
          earningsHistory: [],
          bookingsByProperty: [],
          propertyPerformance: [],
        },
      });
    }

    // Get bookings
    const bookings = await Booking.find({
      property: { $in: propertyIds },
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Get rents for earnings calculation
    const rents = await Rent.find({
      property: { $in: propertyIds },
    });

    // Calculate metrics
    const now = new Date();
    const activeBookings = bookings.filter((b: any) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return checkIn <= now && checkOut >= now;
    }).length;

    const totalBookings = bookings.length;
    const totalEarnings = bookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);
    const monthlyEarnings = bookings
      .filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        const now = new Date();
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum: number, b: any) => sum + b.totalPrice, 0);

    // Average rating
    const avgRating =
      properties.reduce((sum: number, p: any) => sum + (p.ratings?.average || 0), 0) /
      Math.max(properties.length, 1);

    // Occupancy rate
    const occupancyRate = Math.round((activeBookings / Math.max(totalBookings, 1)) * 100);

    // Earnings history (mock for now)
    const earningsHistory = generateEarningsHistory(days);

    // Bookings by property
    const bookingsByProperty = properties.map((prop: any) => ({
      property: prop.title,
      bookings: bookings.filter((b: any) => b.property.toString() === prop._id.toString())
        .length,
    }));

    // Property performance
    const propertyPerformance = properties.map((prop: any) => ({
      property: prop.title,
      occupancy: Math.round((activeBookings / Math.max(totalBookings, 1)) * 100),
      rating: prop.ratings?.average || 0,
    }));

    return NextResponse.json({
      analytics: {
        totalEarnings,
        monthlyEarnings,
        totalBookings,
        activeBookings,
        totalProperties: properties.length,
        occupancyRate,
        averageRating: Math.round(avgRating * 10) / 10,
        earningsHistory,
        bookingsByProperty,
        propertyPerformance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function generateEarningsHistory(days: number) {
  const history = [];
  const now = new Date();

  for (let i = Math.floor(days / 30); i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    history.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      earnings: Math.floor(Math.random() * 500000) + 300000,
    });
  }

  return history;
}
