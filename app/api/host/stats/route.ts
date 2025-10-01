import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import Rent from '@/models/Rent';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get the authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (user._id as any).toString();
    
    // Get all properties owned by this host
    const properties = await Property.find({ owner: userId });
    const propertyIds = properties.map(p => p._id);

    // Get bookings for host's properties
    const bookings = await Booking.find({ 
      property: { $in: propertyIds } 
    });

    // Get rents for host's properties
    const rents = await Rent.find({ 
      property: { $in: propertyIds } 
    });

    // Calculate stats
    const totalProperties = properties.length;
    const activeListings = properties.filter(p => p.status === 'active').length;
    const totalBookings = bookings.length;
    
    // Calculate total revenue from confirmed bookings
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Count pending rents (due within next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const pendingRents = rents.filter(rent => {
      const dueDate = new Date(rent.nextDue);
      return dueDate >= now && dueDate <= thirtyDaysFromNow;
    }).length;

    // Calculate occupancy rate (simplified)
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const occupancyRate = totalProperties > 0 ? (confirmedBookings / totalProperties) * 100 : 0;

    const stats = {
      totalProperties,
      activeListings,
      totalBookings,
      totalRevenue,
      pendingRents,
      occupancyRate: Math.round(occupancyRate)
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching host stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}