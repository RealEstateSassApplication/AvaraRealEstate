import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import Transaction from '@/models/Transaction';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();
    const [totalUsers, totalProperties, pendingProperties, activeListings, totalBookings, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'active' }),
      Booking.countDocuments(),
      Transaction.aggregate([
        { $match: { status: 'completed', type: 'booking' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    return NextResponse.json({
      totalUsers,
      totalProperties,
      pendingProperties,
      activeListings,
      totalBookings,
      totalRevenue
    });
  } catch (err: any) {
    console.error('Admin stats error', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
