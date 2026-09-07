import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import RentService from '@/services/rentService';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: rentId, action } = params;
    if (!rentId || !action) {
      return NextResponse.json({ error: 'Rent ID and action are required' }, { status: 400 });
    }

    const rent = await Rent.findById(rentId).populate('property');
    if (!rent) return NextResponse.json({ error: 'Rent not found' }, { status: 404 });

    const userId = user._id.toString();
    const roles = Array.isArray((user as any).roles) ? (user as any).roles : [(user as any).role];
    const isAdmin = roles.includes('admin') || roles.includes('super-admin');
    const propertyOwnerId = (rent.property as any).owner.toString();
    if (!isAdmin && propertyOwnerId !== userId) {
      return NextResponse.json({ error: 'You can only manage rents for your own properties' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    let result;

    switch (action) {
      case 'mark_paid':
        result = await RentService.markAsPaid(rentId, userId, {
          method: body.method,
          providerReference: body.providerReference,
          notes: body.notes,
          paidAt: body.paidAt,
        });
        break;
      case 'send_reminder':
        result = await RentService.sendReminderForRent(rentId);
        break;
      case 'end_lease':
        result = await RentService.endLease(rentId, propertyOwnerId, body.reason);
        break;
      case 'deposit_held':
        result = await RentService.setDepositStatus(rentId, propertyOwnerId, 'held');
        break;
      case 'deposit_refunded':
        result = await RentService.setDepositStatus(rentId, propertyOwnerId, 'refunded');
        break;
      case 'deposit_forfeited':
        result = await RentService.setDepositStatus(rentId, propertyOwnerId, 'forfeited');
        break;
      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: mark_paid, send_reminder, end_lease, deposit_held, deposit_refunded, deposit_forfeited'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Rent ${action.replace(/_/g, ' ')} successfully`
    });
  } catch (error: any) {
    console.error(`Error performing rent action ${params.action}:`, error);
    const status = error?.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { error: error?.message || `Failed to ${params.action.replace(/_/g, ' ')} rent` },
      { status }
    );
  }
}
