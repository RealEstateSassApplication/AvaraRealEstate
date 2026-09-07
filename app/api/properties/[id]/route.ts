import { NextRequest, NextResponse } from 'next/server';
import PropertyService from '@/services/propertyService';
import { requireAuth } from '@/lib/auth';
import { updatePropertySchema } from '@/lib/propertyInput';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await PropertyService.getById(params.id);
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('Property fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const parsed = updatePropertySchema.safeParse(await request.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Invalid property update' }, { status: 400 });
    }

    const property = await PropertyService.updateProperty(
      params.id,
      parsed.data as any,
      user._id.toString()
    );
    if (!property) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Property updated successfully', property });
  } catch (error: any) {
    if (error?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Property update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const deleted = await PropertyService.deleteProperty(params.id, user._id.toString());
    if (!deleted) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error: any) {
    if (error?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Property deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
