import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import getUserFromReq from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromReq(request as any);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const limit = Number(searchParams.get('limit')) || 50;

    // Get all properties owned by this host
    const properties = await Property.find({ owner: user._id }).select('_id');
    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        bookings: [],
        stats: {
          totalBookings: 0,
          activeBookings: 0,
          upcomingBookings: 0,
          totalRevenue: 0,
          occupancyRate: 0,
        },
      });
    }

    // Get bookings for these properties
    const bookings = await Booking.find({
      property: { $in: propertyIds },
    })
      .populate('property', 'title address')
      .populate('guest', 'name email phone')
      .sort({ checkInDate: -1 })
      .limit(limit);

    if (includeStats) {
      const now = new Date();
      const activeBookings = bookings.filter((b: any) => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        return checkIn <= now && checkOut >= now;
      }).length;

      const upcomingBookings = bookings.filter((b: any) => {
        const checkIn = new Date(b.checkInDate);
        return checkIn > now;
      }).length;

      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);

      return NextResponse.json({
        bookings,
        stats: {
          totalBookings: bookings.length,
          activeBookings,
          upcomingBookings,
          totalRevenue,
          occupancyRate: bookings.length > 0 ? Math.round((activeBookings / bookings.length) * 100) : 0,
        },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
