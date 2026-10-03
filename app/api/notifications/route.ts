import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';
import NotificationService from '@/services/notificationService';
import { requireAuth } from '@/lib/auth';
import { getRoles } from '@/lib/permissions';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://avara.lk';

function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Authentication')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const body = await request.json();
    const { type, propertyId, bookingId, message, recipientType } = body;

    if (!type || !propertyId || recipientType !== 'host') {
      return NextResponse.json(
        { error: 'type, propertyId and recipientType=host are required' },
        { status: 400 }
      );
    }

    const property = await Property.findById(propertyId).populate('owner', 'name email phone');
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    const owner = property.owner as any;
    const ownerId = owner?._id?.toString();
    const roles = getRoles(user);
    const isAdmin = roles.includes('admin') || roles.includes('super-admin');
    const isOwner = ownerId === userId;

    // This public route may only be used by the property owner/admin or by the
    // authenticated guest attached to the supplied booking. Other notification
    // creation should happen internally in the relevant application/service.
    if (!isOwner && !isAdmin) {
      if (!bookingId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const booking = await Booking.findOne({
        _id: bookingId,
        property: property._id,
        user: user._id,
      }).select('_id');

      if (!booking) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'Property owner not found' }, { status: 409 });
    }

    const safeMessage =
      typeof message === 'string' && message.trim()
        ? message.trim().slice(0, 1000)
        : `New activity for ${property.title}`;

    const notification = await Notification.create({
      user: ownerId,
      type: String(type).slice(0, 100),
      message: safeMessage,
      metadata: {
        propertyId: property._id,
        bookingId: bookingId || undefined,
        actorId: user._id,
      },
    });

    let externalDelivery: { channel: string; status: string; providerMessageId?: string } | null = null;

    if (owner?.phone) {
      const hostMessage =
        `New activity for "${property.title}". Check your Avara dashboard: ${APP_URL}/host/dashboard`;

      try {
        const result = await NotificationService.sendWhatsApp(owner.phone, hostMessage);
        externalDelivery = {
          channel: 'whatsapp',
          status: 'sent',
          providerMessageId: result.providerMessageId,
        };
      } catch (whatsappError) {
        try {
          const result = await NotificationService.sendSMS(owner.phone, hostMessage);
          externalDelivery = {
            channel: 'sms',
            status: 'sent',
            providerMessageId: result.providerMessageId,
          };
        } catch (smsError) {
          console.error('External host notification failed:', {
            whatsappError,
            smsError,
          });
          externalDelivery = { channel: 'external', status: 'failed' };
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        notification,
        externalDelivery,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Notification POST error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query: Record<string, unknown> = { user: user._id };
    if (unreadOnly) query.read = false;
    if (type) query.type = type;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ user: user._id, read: false }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      message: 'Notifications retrieved',
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications' }, { status: 500 });
  }
}
