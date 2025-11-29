import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

// GET /api/admin/properties/[id] - Get single property details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const property = await Property.findById(params.id)
      .populate('owner', 'name email phone');

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (err: any) {
    console.error('Admin get property error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/properties/[id] - Delete a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const property = await Property.findByIdAndDelete(params.id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Property deleted successfully' 
    });
  } catch (err: any) {
    console.error('Admin delete property error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/properties/[id] - Update property (featured, status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const body = await request.json();
    const { featured, verified, status } = body;

    const updateData: any = {};
    if (typeof featured === 'boolean') updateData.featured = featured;
    if (typeof verified === 'boolean') updateData.verified = verified;
    if (status) updateData.status = status;

    const property = await Property.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('owner', 'name email');

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      property,
      message: 'Property updated successfully' 
    });
  } catch (err: any) {
    console.error('Admin update property error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
