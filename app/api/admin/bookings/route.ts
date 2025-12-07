import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property'; // Ensure model is registered
import User from '@/models/User'; // Ensure model is registered

export async function GET(request: NextRequest) {
    try {
        await requireRole(request, ['admin', 'super-admin']);
        await dbConnect();

        // Ensure models are registered to avoid populate errors
        // (imported above)

        const { searchParams } = new URL(request.url);
        const limit = Number(searchParams.get('limit')) || 20;
        const page = Number(searchParams.get('page')) || 1;
        const status = searchParams.get('status');

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('property', 'title address')
            .populate('user', 'name email')
            .populate('host', 'name email');

        const total = await Booking.countDocuments(query);

        return NextResponse.json({ bookings, total, pages: Math.ceil(total / limit) });
    } catch (err: any) {
        console.error('Admin bookings list error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
