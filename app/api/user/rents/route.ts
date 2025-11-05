import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/user/rents - Get all rents for the logged-in user (as tenant)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const filter: any = { tenant: user._id };
    if (status) {
      filter.status = status;
    }

    const rents = await Rent.find(filter)
      .populate('property', 'title address images')
      .populate('host', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      rents,
      count: rents.length
    });
  } catch (error: any) {
    console.error('Error fetching user rents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rents', details: error.message },
      { status: 500 }
    );
  }
}
