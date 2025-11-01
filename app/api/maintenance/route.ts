import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Property from '@/models/Property';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, rentId, title, description, category, priority, images } = body;

    if (!propertyId || !title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get property to find host
    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      property: propertyId,
      tenant: user._id,
      host: property.owner,
      rent: rentId || undefined,
      title,
      description,
      category,
      priority: priority || 'medium',
      images: images || [],
      status: 'pending'
    });

    return NextResponse.json({ ok: true, data: maintenanceRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: error.message || 'Failed to create maintenance request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'host' or 'tenant'
    const hostId = searchParams.get('hostId');
    const tenantId = searchParams.get('tenantId');
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    let query: any = {};

    if (type === 'host') {
      query.host = hostId || user._id;
    } else if (type === 'tenant') {
      query.tenant = tenantId || user._id;
    } else if (hostId) {
      query.host = hostId;
    } else if (tenantId) {
      query.tenant = tenantId;
    }

    if (propertyId) {
      query.property = propertyId;
    }

    if (status) {
      query.status = status;
    }

    const requests = await MaintenanceRequest.find(query)
      .populate('property', 'title address images')
      .populate('tenant', 'name email phone')
      .populate('host', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, data: requests });
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}
