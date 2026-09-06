import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Property from '@/models/Property';
import Rent from '@/models/Rent';
import { getUserFromRequest } from '@/lib/auth';

const createSchema = z.object({
  propertyId: z.string().min(1),
  rentId: z.string().optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(5000),
  category: z.string().trim().min(1).max(80),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  images: z.array(z.string().max(500)).max(10).optional(),
}).strict();

function rolesFor(user: any): string[] {
  return Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
}

function isAdmin(user: any) {
  const roles = rolesFor(user);
  return roles.includes('admin') || roles.includes('super-admin');
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid maintenance request' }, { status: 400 });
    }
    const body = parsed.data;

    const property = await Property.findById(body.propertyId).select('_id owner');
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    // A tenant may only create a maintenance request for a property they
    // currently rent. This prevents arbitrary users from opening tickets on
    // unrelated properties or discovering owner information.
    const rentQuery: any = {
      property: property._id,
      tenant: user._id,
      status: 'active',
    };
    if (body.rentId) rentQuery._id = body.rentId;
    const activeRent = await Rent.findOne(rentQuery).select('_id');
    if (!activeRent) {
      return NextResponse.json({ error: 'No active tenancy found for this property' }, { status: 403 });
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      property: property._id,
      tenant: user._id,
      host: property.owner,
      rent: activeRent._id,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority || 'medium',
      images: body.images || [],
      status: 'pending',
    });

    return NextResponse.json({ ok: true, data: maintenanceRequest }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const requestedHostId = searchParams.get('hostId');
    const requestedTenantId = searchParams.get('tenantId');
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    const roles = rolesFor(user);
    const query: any = {};

    if (isAdmin(user)) {
      if (requestedHostId) query.host = requestedHostId;
      if (requestedTenantId) query.tenant = requestedTenantId;
      if (!requestedHostId && !requestedTenantId) {
        if (type === 'host') query.host = user._id;
        else if (type === 'tenant') query.tenant = user._id;
      }
    } else if (type === 'host' || (!type && roles.includes('host'))) {
      if (!roles.includes('host')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      query.host = user._id;
    } else {
      query.tenant = user._id;
    }

    if (propertyId) query.property = propertyId;
    if (status) query.status = status;

    const requests = await MaintenanceRequest.find(query)
      .populate('property', 'title address images')
      .populate('tenant', 'name email phone')
      .populate('host', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();

    return NextResponse.json({ ok: true, data: requests });
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}
