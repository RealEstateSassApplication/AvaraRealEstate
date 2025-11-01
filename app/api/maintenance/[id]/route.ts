import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, priority, estimatedCost, actualCost, scheduledDate, completedDate, assignedTo, notes } = body;

    const maintenanceRequest = await MaintenanceRequest.findById(params.id);
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    // Check if user is host
      // user._id can be unknown from getUserFromRequest typings; cast to any for comparison
      if (maintenanceRequest.host.toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: 'Only the host can update this request' }, { status: 403 });
    }

    // Update fields
    if (status) maintenanceRequest.status = status;
    if (priority) maintenanceRequest.priority = priority;
    if (estimatedCost !== undefined) maintenanceRequest.estimatedCost = estimatedCost;
    if (actualCost !== undefined) maintenanceRequest.actualCost = actualCost;
    if (scheduledDate) maintenanceRequest.scheduledDate = new Date(scheduledDate);
    if (completedDate) maintenanceRequest.completedDate = new Date(completedDate);
    if (assignedTo) maintenanceRequest.assignedTo = assignedTo;
    if (notes) maintenanceRequest.notes = notes;

    if (status === 'completed' && !maintenanceRequest.completedDate) {
      maintenanceRequest.completedDate = new Date();
    }

    await maintenanceRequest.save();

    return NextResponse.json({ ok: true, data: maintenanceRequest });
  } catch (error: any) {
    console.error('Error updating maintenance request:', error);
    return NextResponse.json({ error: error.message || 'Failed to update maintenance request' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maintenanceRequest = await MaintenanceRequest.findById(params.id);
    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    // Allow deletion by either tenant or host
    const isTenant = maintenanceRequest.tenant.toString() === (user as any)._id.toString();
    const isHost = maintenanceRequest.host.toString() === (user as any)._id.toString();

    if (!isTenant && !isHost) {
      return NextResponse.json({ error: 'Unauthorized to delete this request' }, { status: 403 });
    }

    await MaintenanceRequest.findByIdAndDelete(params.id);

    return NextResponse.json({ ok: true, message: 'Maintenance request deleted' });
  } catch (error: any) {
    console.error('Error deleting maintenance request:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete maintenance request' }, { status: 500 });
  }
}
