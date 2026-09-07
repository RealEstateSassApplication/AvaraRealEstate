import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import { getUserFromRequest } from '@/lib/auth';
import BookingService from '@/services/bookingService';
import NotificationService from '@/services/notificationService';

function rolesFor(user: any): string[] {
  return Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: bookingId, action } = params;
    if (!bookingId || !action) {
      return NextResponse.json({ error: 'Booking ID and action are required' }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId).populate('property user');
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const userId = user._id.toString();
    const roles = rolesFor(user);
    const isAdmin = roles.includes('admin') || roles.includes('super-admin');
    const propertyOwnerId = (booking.property as any).owner?.toString();
    if (!isAdmin && propertyOwnerId !== userId) {
      return NextResponse.json({ error: 'You can only manage bookings for your own properties' }, { status: 403 });
    }

    let result: any;
    let notificationMessage = '';

    switch (action) {
      case 'approve':
      case 'confirm':
        if (booking.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending bookings can be approved' }, { status: 409 });
        }
        result = await BookingService.confirmBooking(bookingId);
        notificationMessage = `Your booking for "${(booking.property as any).title}" has been approved by the host. Check-in: ${new Date(booking.startDate).toLocaleDateString()}. Check-out: ${new Date(booking.endDate).toLocaleDateString()}.`;
        break;

      case 'decline':
      case 'reject':
        if (booking.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending bookings can be declined' }, { status: 409 });
        }
        result = await BookingService.cancelBookingByActor(
          bookingId,
          userId,
          isAdmin ? roles : [...roles, 'host'],
          'Host declined the booking request'
        );
        notificationMessage = `Your booking request for "${(booking.property as any).title}" has been declined by the host. No payment was recorded for this reservation.`;
        break;

      case 'cancel':
        result = await BookingService.cancelBookingByActor(
          bookingId,
          userId,
          isAdmin ? roles : [...roles, 'host'],
          'Cancelled by host'
        );
        notificationMessage = `Your booking for "${(booking.property as any).title}" has been cancelled by the host.`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action. Supported actions: approve, confirm, decline, reject, cancel' }, { status: 400 });
    }

    if (!result) return NextResponse.json({ error: 'Booking not found or not permitted' }, { status: 404 });

    const guest = booking.user as any;
    if (guest?.phone && notificationMessage) {
      try {
        if (process.env.WHATSAPP_API_KEY) {
          try {
            await NotificationService.sendWhatsApp(guest.phone, notificationMessage);
          } catch {
            if (process.env.TWILIO_SID) await NotificationService.sendSMS(guest.phone, notificationMessage);
          }
        } else if (process.env.TWILIO_SID) {
          await NotificationService.sendSMS(guest.phone, notificationMessage);
        }
      } catch (error) {
        console.error('Failed to send guest notification:', error);
      }
    }

    return NextResponse.json({ success: true, data: result, message: `Booking ${action} successful` });
  } catch (error: any) {
    console.error(`Error performing booking action ${params.action}:`, error);
    if (error?.message?.includes('refund workflow')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: `Failed to ${params.action} booking` }, { status: 500 });
  }
}
