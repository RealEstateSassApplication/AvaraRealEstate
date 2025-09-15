import { NextRequest, NextResponse } from 'next/server';
import PropertyService from '@/services/propertyService';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const property = await PropertyService.getById(params.id);

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ property });

  } catch (error: any) {
    console.error('Property fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const updates = await request.json();

    const property = await PropertyService.updateProperty(
      params.id,
      updates,
      (user as any)._id?.toString()
    );

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Property updated successfully',
      property
    });

  } catch (error: any) {
    console.error('Property update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    const deleted = await PropertyService.deleteProperty(
      params.id,
      (user as any)._id?.toString()
    );

    if (!deleted) {
      return NextResponse.json(
        { error: 'Property not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Property deleted successfully'
    });

  } catch (error: any) {
    console.error('Property deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}