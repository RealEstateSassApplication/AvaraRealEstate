import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import User from '@/models/User';
import Transaction from '@/models/Transaction'; // Assuming this tracks payments

export async function GET(request: NextRequest) {
    try {
        await requireRole(request, ['admin', 'super-admin']);
        await dbConnect();

        // 1. Total Revenue (from completed bookings/transactions)
        // Assuming Booking has totalAmount and status 'completed' implies paid revenue.
        const revenueAgg = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        // 2. Revenue by Month (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await Booking.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$totalAmount' },
                    year: { $first: { $year: '$createdAt' } }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 3. User Growth (Last 6 months)
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 4. Property Distribution by Type
        const propertyDistribution = await Property.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 5. Recent Activity Log (Mocked or from a Log model if exists, otherwise top 5 recent bookings)
        const recentActivity = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name')
            .populate('property', 'title')
            .select('status createdAt totalAmount');

        return NextResponse.json({
            totalRevenue,
            monthlyRevenue,
            userGrowth,
            propertyDistribution,
            recentActivity
        });

    } catch (err: any) {
        console.error('Admin reports error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
