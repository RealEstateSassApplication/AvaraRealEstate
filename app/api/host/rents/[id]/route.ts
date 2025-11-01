import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import Transaction from '@/models/Transaction';
import getUserFromReq from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = (await getUserFromReq(request as any)) as { _id: string } | null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rent = await Rent.findById(params.id)
      .populate('property', 'title type address images owner')
      .populate('tenant', 'name email phone verified');

    if (!rent) {
      return NextResponse.json({ error: 'Rent not found' }, { status: 404 });
    }

    // Verify ownership
    const property = await require('@/models/Property').default.findById(rent.property._id);
    if (property?.owner.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ rent, data: rent }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rent:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = (await getUserFromReq(request as any)) as { _id: string } | null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    const rent = await Rent.findById(params.id).populate('property');

    if (!rent) {
      return NextResponse.json({ error: 'Rent not found' }, { status: 404 });
    }

    // Verify ownership
    if (rent.property.owner.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (status) {
      rent.status = status;
    }
    if (notes) {
      rent.notes = notes;
    }

    rent.updatedAt = new Date();
    await rent.save();

    return NextResponse.json({ rent, message: 'Rent updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating rent:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = (await getUserFromReq(request as any)) as { _id: string } | null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rent = await Rent.findById(params.id).populate('property');

    if (!rent) {
      return NextResponse.json({ error: 'Rent not found' }, { status: 404 });
    }

    // Verify ownership
    if (rent.property.owner.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Rent.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Rent deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting rent:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
