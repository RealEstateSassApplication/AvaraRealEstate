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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rentId, action } = params;
    
    if (!rentId || !action) {
      return NextResponse.json({ 
        error: 'Rent ID and action are required' 
      }, { status: 400 });
    }

    // Verify the rent belongs to the current user's properties
    const rent = await Rent.findById(rentId).populate('property');
    if (!rent) {
      return NextResponse.json({ error: 'Rent not found' }, { status: 404 });
    }

    const userId = (user._id as any).toString();
    if ((rent.property as any).owner.toString() !== userId) {
      return NextResponse.json({ 
        error: 'You can only manage rents for your own properties' 
      }, { status: 403 });
    }

    let result;
    
    switch (action) {
      case 'mark_paid':
        result = await RentService.markAsPaid(rentId);
        break;
        
      case 'send_reminder':
        // For a single rent reminder
        const reminderResults = await RentService.triggerReminders({ daysBefore: 30 });
        result = reminderResults.find(r => r.rentId === rentId);
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: mark_paid, send_reminder' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Rent ${action.replace('_', ' ')} successfully`
    });

  } catch (error) {
    console.error(`Error performing rent action ${params.action}:`, error);
    return NextResponse.json(
      { error: `Failed to ${params.action.replace('_', ' ')} rent` },
      { status: 500 }
    );
  }
}