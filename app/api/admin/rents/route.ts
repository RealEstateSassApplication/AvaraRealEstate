import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';

// GET /api/admin/rents - Get all rentals for admin
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Number(searchParams.get('limit')) || 50;
    const page = Number(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const [rents, total] = await Promise.all([
      Rent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('property', 'title images address price currency')
        .populate('tenant', 'name email phone')
        .populate('host', 'name email phone')
        .lean(),
      Rent.countDocuments(query)
    ]);

    // Calculate stats
    const stats = await Rent.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const rentStats = {
      total: total,
      pending: 0,
      paid: 0,
      overdue: 0,
      totalRevenue: 0
    };

    stats.forEach((s: any) => {
      if (s._id === 'pending') rentStats.pending = s.count;
      if (s._id === 'paid') {
        rentStats.paid = s.count;
        rentStats.totalRevenue = s.totalAmount;
      }
      if (s._id === 'overdue') rentStats.overdue = s.count;
    });

    return NextResponse.json({
      success: true,
      rents,
      stats: rentStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Admin rents list error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
