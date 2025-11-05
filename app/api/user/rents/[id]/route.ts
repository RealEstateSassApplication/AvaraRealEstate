import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/user/rents/[id] - Get specific rent details for the logged-in user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rent = await Rent.findOne({
      _id: params.id,
      tenant: user._id
    })
      .populate('property', 'title address images')
      .populate('host', 'firstName lastName email phoneNumber')
      .lean();

    if (!rent) {
      return NextResponse.json(
        { error: 'Rent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rent
    });
  } catch (error: any) {
    console.error('Error fetching rent details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rent details', details: error.message },
      { status: 500 }
    );
  }
}
