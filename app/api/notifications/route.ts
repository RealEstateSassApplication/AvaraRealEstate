import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import NotificationService from '@/services/notificationService';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { type, propertyId, bookingId, message, recipientType } = body;

    if (!type || !propertyId) {
      return NextResponse.json({ error: 'Type and propertyId are required' }, { status: 400 });
    }

    // Get property details
    const property = await Property.findById(propertyId).populate('owner');
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    let notifications = [];

    if (recipientType === 'host' && property.owner) {
      const host = property.owner as any;
      
      // Send WhatsApp/SMS notification to host
      if (host.phone) {
        const hostMessage = `🏠 New rental request for "${property.title}"!\n\nA guest has requested to rent your property. Please check your dashboard to approve or decline.\n\nProperty: ${property.title}\nLocation: ${property.address?.city}, ${property.address?.district}\n\nLogin to manage: https://avararrealestate.com/host/dashboard`;
        
        try {
          // Try WhatsApp first, fallback to SMS
          let notificationSent = false;
          
          if (process.env.WHATSAPP_API_KEY) {
            try {
              await NotificationService.sendWhatsApp(host.phone, hostMessage);
              notificationSent = true;
            } catch (whatsappError) {
              console.log('WhatsApp notification failed, falling back to SMS');
            }
          }
          
          if (!notificationSent && process.env.TWILIO_SID) {
            await NotificationService.sendSMS(host.phone, hostMessage);
          }
          
          notifications.push({
            type: 'host_notification',
            recipient: host._id,
            method: notificationSent ? 'whatsapp' : 'sms',
            status: 'sent'
          });
          
        } catch (error) {
          console.error('Failed to send host notification:', error);
          notifications.push({
            type: 'host_notification',
            recipient: host._id,
            method: 'failed',
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Also send email notification if email is available
      if (host.email) {
        // Store in-app notification (you could extend this to actual email service)
        notifications.push({
          type: 'host_email_notification',
          recipient: host._id,
          method: 'in_app',
          status: 'pending',
          message: `New rental request for ${property.title}`,
          propertyId,
          bookingId
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications sent',
      notifications 
    });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send notifications' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const Notification = (await import('@/models/Notification')).default;
    const query: any = { user: userId };
    if (unreadOnly) query.read = false;
    if (type) query.type = type;

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({ 
      notifications,
      unreadCount: await Notification.countDocuments({ user: userId, read: false }),
      message: 'Notifications retrieved' 
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve notifications' 
    }, { status: 500 });
  }
}