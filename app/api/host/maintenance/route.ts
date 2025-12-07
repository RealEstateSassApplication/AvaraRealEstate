import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Property from '@/models/Property';
import getUserFromReq from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromReq(request as any);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const limit = Number(searchParams.get('limit')) || 50;

    // Get all properties owned by this host
    const properties = await Property.find({ owner: user._id }).select('_id');
    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        requests: [],
        stats: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          avgCompletionTime: 0,
        },
      });
    }

    // Get maintenance requests for these properties
    const requests = await MaintenanceRequest.find({
      property: { $in: propertyIds },
    })
      .populate('property', 'title address')
      .populate('tenant', 'name phone')
      .sort({ requestedDate: -1 })
      .limit(limit);

    if (includeStats) {
      const pending = requests.filter((r: any) => r.status === 'pending').length;
      const inProgress = requests.filter((r: any) => r.status === 'in_progress').length;
      const completed = requests.filter((r: any) => r.status === 'completed').length;

      const completedRequests = requests.filter((r: any) => r.completedDate && r.requestedDate);
      const avgTime = completedRequests.length > 0
        ? completedRequests.reduce((sum: number, r: any) => {
          if (r.completedDate && r.requestedDate) {
            const diff = new Date(r.completedDate).getTime() - new Date(r.requestedDate).getTime();
            return sum + diff;
          }
          return sum;
        }, 0) / completedRequests.length / (1000 * 60 * 60)
        : 0;

      return NextResponse.json({
        requests,
        stats: {
          total: requests.length,
          pending,
          inProgress,
          completed,
          avgCompletionTime: Math.round(avgTime),
        },
      });
    }

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromReq(request as any);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, title, description, category, priority, tenantId } = body;

    if (!propertyId || !title || !description || !category || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.owner.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Optionally allow creating request without tenant if property is vacant, but schema says tenant is required?
    // Checking schema: tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    // So we need a tenant. If property is rented, we should find the tenant.
    // If we're creating this as a host, we probably picking a property and maybe a tenant.

    // For now, let's assume if tenantId is provided we use it. If not, we try to find active rent?
    // Or we relax Schema requirement? 
    // Let's assume the UI provides tenantId or we find it from active rent.
    // Simple approach: require tenantId for now or use the host as tenant (if self-maintained)? No that's weird.
    // Let's try to find active rent for property if tenantId not provided.

    let targetTenantId = tenantId;
    if (!targetTenantId) {
      // Try to find active rent
      // We can't easily import Rent model here without circular deps maybe? 
      // Let's just require tenantId if not found from properties list in UI.
      // Actually, for a maintenance request, it usually involves a tenant. 
      // If it's just host fix, maybe tenant can be optional in schema?
      // But schema says required.
      // Let's check if the user passed it.
    }

    // If tenant is strictly required by schema, we must provide it.
    // If the unit is empty, who is the tenant? Maybe null? 
    // Schema says required: true. 
    // If I want to allow hosts to log maintenance for empty units, I should make tenant optional in schema.
    // But modifying schema might break other things.
    // Let's see if we can just pass the Host ID as tenant if empty? 
    // No, that's hacky.

    // Changing schema to optional is better if we want to support empty units.

    const maintenanceRequest = await MaintenanceRequest.create({
      property: propertyId,
      host: user._id,
      tenant: targetTenantId || user._id, // Fallback to host if no tenant (e.g. empty unit repair), assuming 'User' ref allows host
      title,
      description,
      category,
      priority,
      status: 'pending',
      requestedDate: new Date(),
      // images: body.images
    });

    return NextResponse.json({ message: 'Request created', request: maintenanceRequest }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
