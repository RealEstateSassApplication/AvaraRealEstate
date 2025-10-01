import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';
import Property from '@/models/Property';
import NotificationService from '@/services/notificationService';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const body = await request.json();
    const required = ['propertyId', 'startDate', 'durationMonths', 'monthlyRent'];
    const missing = required.filter(f => !body[f]);
    if (missing.length) return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });

    const property = await Property.findById(body.propertyId).populate('owner');
    if (!property) return NextResponse.json({ error: 'Property not found', reason: 'not_found' }, { status: 404 });

    // Build application record
    const durationMonths = Number(body.durationMonths);
    const monthlyRent = Number(body.monthlyRent || property.price || 0);
    const totalRent = monthlyRent * durationMonths;

    const app = await Application.create({
      property: property._id,
      user: (user as any)._id,
      host: (property.owner as any)._id,
      startDate: new Date(body.startDate),
      durationMonths,
      monthlyRent,
      totalRent,
      numberOfOccupants: body.numberOfOccupants,
      employmentStatus: body.employmentStatus,
      monthlyIncome: body.monthlyIncome,
      hasPets: !!body.hasPets,
      petDetails: body.petDetails,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      additionalNotes: body.additionalNotes
    });
    // Notify host (WhatsApp / SMS / in-app) about new application
    try {
      const host = property.owner as any;
      if (host?.phone) {
        const hostMessage = `🏠 New rental application for "${property.title}"\nApplicant: ${body.fullName || (user as any).name || 'Unknown'}\nStart: ${body.startDate}\nDuration: ${durationMonths} months\nCheck dashboard: https://avararrealestate.com/host/dashboard`;
        let sent = false;
        if (process.env.WHATSAPP_API_KEY) {
          try { await NotificationService.sendWhatsApp(host.phone, hostMessage); sent = true; } catch(e) { console.log('WhatsApp failed'); }
        }
        if (!sent && process.env.TWILIO_SID) {
          try { await NotificationService.sendSMS(host.phone, hostMessage); sent = true; } catch(e) { console.log('SMS failed'); }
        }
      }

      // Persist in-app notification for host
      try {
        const host = property.owner as any;
        if (host && host._id) {
          await Notification.create({
            user: (host as any)._id,
            type: 'application_submitted',
            message: `New application for ${property.title} from ${(user as any).name || 'Applicant'}`,
            metadata: { applicationId: app._id, propertyId: property._id }
          });
        }
      } catch (nerr) {
        console.error('Failed to persist in-app notification:', nerr);
      }
    } catch (notifyErr) {
      console.error('Failed to notify host of application:', notifyErr);
    }
    return NextResponse.json({ message: 'Application submitted', data: app }, { status: 201 });
  } catch (err: any) {
    console.error('Applications POST error:', err);
    if (err?.message && err.message.toLowerCase().includes('unauthorized')) return NextResponse.json({ error: 'Authentication required', reason: 'unauthenticated' }, { status: 401 });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const propertyId = searchParams.get('propertyId');

    const hostQuery = searchParams.get('host');
    if (hostQuery === 'true') {
      // Return all applications where current user is host
      const apps = await Application.find({ host: (user as any)._id })
        .populate('property', 'title address price')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ data: apps });
    }

    if (userId) {
      const apps = await Application.find({ user: userId })
        .populate('property', 'title address price')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ data: apps });
    }

    if (propertyId) {
      // Only allow host to query their property
      const prop = await Property.findById(propertyId).populate('owner');
      if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      if ((prop.owner as any)._id.toString() !== (user as any)._id.toString()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const apps = await Application.find({ property: propertyId })
        .populate('property', 'title address price')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ data: apps });
    }

    // default: return user's applications
    const apps = await Application.find({ user: (user as any)._id })
      .populate('property', 'title address price')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ data: apps });
  } catch (err: any) {
    console.error('Applications GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
