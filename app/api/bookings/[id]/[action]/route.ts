import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromRequest } from '@/lib/auth';
import NotificationService from '@/services/notificationService';
import User from '@/models/User';

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

    const { id: bookingId, action } = params;
    
    if (!bookingId || !action) {
      return NextResponse.json({ 
        error: 'Booking ID and action are required' 
      }, { status: 400 });
    }

    // Get the booking with property details
    const booking = await Booking.findById(bookingId).populate('property user');
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the current user is the property owner (host)
    const userId = (user._id as any).toString();
    const propertyOwnerId = (booking.property as any).owner.toString();
    
    if (propertyOwnerId !== userId) {
      return NextResponse.json({ 
        error: 'You can only manage bookings for your own properties' 
      }, { status: 403 });
    }

    let result;
    let notificationMessage = '';
    
    switch (action) {
      case 'approve':
      case 'confirm':
        if (booking.status !== 'pending') {
          return NextResponse.json({ 
            error: 'Only pending bookings can be approved' 
          }, { status: 400 });
        }
        
        result = await Booking.findByIdAndUpdate(
          bookingId,
          { 
            status: 'confirmed',
            confirmedAt: new Date(),
            confirmedBy: userId
          },
          { new: true }
        );
        
        notificationMessage = `🎉 Great news! Your booking for "${(booking.property as any).title}" has been approved by the host!\\n\\nBooking Details:\\n- Check-in: ${new Date(booking.startDate).toLocaleDateString()}\\n- Check-out: ${new Date(booking.endDate).toLocaleDateString()}\\n- Total: ${booking.currency || 'LKR'} ${booking.totalAmount?.toLocaleString()}\\n\\nThe host will contact you soon with next steps.`;
        break;
        
      case 'decline':
      case 'reject':
        if (booking.status !== 'pending') {
          return NextResponse.json({ 
            error: 'Only pending bookings can be declined' 
          }, { status: 400 });
        }
        
        result = await Booking.findByIdAndUpdate(
          bookingId,
          { 
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: 'Host declined the booking request'
          },
          { new: true }
        );
        
        notificationMessage = `We're sorry, but your booking request for "${(booking.property as any).title}" has been declined by the host.\\n\\nYou can browse other similar properties on our platform. No charges were made to your account.`;
        break;
        
      case 'cancel':
        if (booking.status === 'cancelled') {
          return NextResponse.json({ 
            error: 'Booking is already cancelled' 
          }, { status: 400 });
        }
        
        result = await Booking.findByIdAndUpdate(
          bookingId,
          { 
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: 'Cancelled by host'
          },
          { new: true }
        );
        
        notificationMessage = `Your booking for "${(booking.property as any).title}" has been cancelled by the host.\\n\\nIf you have any questions, please contact our support team.`;
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: approve, decline, cancel' 
        }, { status: 400 });
    }

    // Send notification to the guest
    const guest = booking.user as any;
    if (guest && guest.phone && notificationMessage) {
      try {
        // Try WhatsApp first, fallback to SMS
        if (process.env.WHATSAPP_API_KEY) {
          try {
            await NotificationService.sendWhatsApp(guest.phone, notificationMessage);
          } catch (whatsappError) {
            console.log('WhatsApp notification failed, falling back to SMS');
            if (process.env.TWILIO_SID) {
              await NotificationService.sendSMS(guest.phone, notificationMessage);
            }
          }
        } else if (process.env.TWILIO_SID) {
          await NotificationService.sendSMS(guest.phone, notificationMessage);
        }
      } catch (error) {
        console.error('Failed to send guest notification:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Booking ${action}d successfully`
    });

  } catch (error) {
    console.error(`Error performing booking action ${params.action}:`, error);
    return NextResponse.json(
      { error: `Failed to ${params.action} booking` },
      { status: 500 }
    );
  }
}