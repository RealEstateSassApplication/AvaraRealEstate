import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getRoles } from '@/lib/permissions';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';
import Property from '@/models/Property';
import User from '@/models/User';
import NotificationService from '@/services/notificationService';
import Notification from '@/models/Notification';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://avara.lk';

function isAdmin(user: any) {
  const roles = getRoles(user);
  return roles.includes('admin') || roles.includes('super-admin');
}

function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Authentication')) {
    return NextResponse.json(
      { error: 'Authentication required', reason: 'unauthenticated' },
      { status: 401 }
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const body = await request.json();

    const propertyId = typeof body.propertyId === 'string' ? body.propertyId : '';
    const durationMonths = Number(body.durationMonths);
    const startDate = new Date(body.startDate);

    if (!propertyId || !Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) {
      return NextResponse.json(
        { error: 'A valid propertyId and durationMonths between 1 and 120 are required' },
        { status: 400 }
      );
    }

    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }

    const property = await Property.findById(propertyId).populate('owner', 'name email phone');
    if (!property) {
      return NextResponse.json({ error: 'Property not found', reason: 'not_found' }, { status: 404 });
    }

    if (property.purpose !== 'rent' || property.status !== 'active') {
      return NextResponse.json(
        { error: 'This property is not currently accepting rental applications' },
        { status: 409 }
      );
    }

    let applicantId = user._id;
    let applicantName = user.name;

    if (body.applicantEmail) {
      const ownerId = (property.owner as any)?._id?.toString();
      const canCreateForOthers = ownerId === user._id.toString() || isAdmin(user);
      if (!canCreateForOthers) {
        return NextResponse.json(
          { error: 'Only the property host or an admin can create applications for others' },
          { status: 403 }
        );
      }

      const applicant = await User.findOne({
        email: String(body.applicantEmail).trim().toLowerCase(),
      });
      if (!applicant) {
        return NextResponse.json({ error: 'Applicant with this email not found' }, { status: 404 });
      }
      applicantId = applicant._id;
      applicantName = applicant.name;
    }

    // Rent is server-authoritative. A client-supplied monthlyRent must never
    // change the financial terms stored on an application.
    const monthlyRent = Number(property.price);
    if (!Number.isFinite(monthlyRent) || monthlyRent < 0) {
      return NextResponse.json({ error: 'Property rent is invalid' }, { status: 409 });
    }
    const totalRent = monthlyRent * durationMonths;

    const app = await Application.create({
      property: property._id,
      user: applicantId,
      host: (property.owner as any)._id,
      startDate,
      durationMonths,
      monthlyRent,
      totalRent,
      numberOfOccupants: body.numberOfOccupants,
      employmentStatus: body.employmentStatus,
      monthlyIncome: body.monthlyIncome,
      hasPets: Boolean(body.hasPets),
      petDetails: body.petDetails,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      additionalNotes: body.additionalNotes,
    });

    if (!body.applicantEmail) {
      const host = property.owner as any;

      try {
        await Notification.create({
          user: host._id,
          type: 'application_submitted',
          message: `New application for ${property.title} from ${applicantName || 'Applicant'}`,
          metadata: { applicationId: app._id, propertyId: property._id },
        });
      } catch (notificationError) {
        console.error('Failed to persist application notification:', notificationError);
      }

      if (host?.phone) {
        const hostMessage =
          `New rental application for "${property.title}". Applicant: ${applicantName || 'Applicant'}. ` +
          `Start: ${startDate.toLocaleDateString()}. Duration: ${durationMonths} months. ` +
          `Review it at ${APP_URL}/host/dashboard`;

        try {
          await NotificationService.sendWhatsApp(host.phone, hostMessage);
        } catch {
          try {
            await NotificationService.sendSMS(host.phone, hostMessage);
          } catch (externalNotificationError) {
            console.error('Failed to notify host externally:', externalNotificationError);
          }
        }
      }
    }

    return NextResponse.json({ message: 'Application submitted', data: app }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Applications POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const propertyId = searchParams.get('propertyId');
    const hostQuery = searchParams.get('host');
    const admin = isAdmin(user);

    if (hostQuery === 'true') {
      const apps = await Application.find({ host: user._id })
        .populate('property', 'title address price currency')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ data: apps });
    }

    if (requestedUserId) {
      if (!admin && requestedUserId !== user._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const apps = await Application.find({ user: requestedUserId })
        .populate('property', 'title address price currency')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ data: apps });
    }

    if (propertyId) {
      const property = await Property.findById(propertyId).select('owner');
      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      if (!admin && property.owner.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const apps = await Application.find({ property: propertyId })
        .populate('property', 'title address price currency')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ data: apps });
    }

    const apps = await Application.find({ user: user._id })
      .populate('property', 'title address price currency')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: apps });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Applications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
