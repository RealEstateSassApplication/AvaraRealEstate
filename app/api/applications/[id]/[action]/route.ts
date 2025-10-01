import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';
import Property from '@/models/Property';
import Notification from '@/models/Notification';
import NotificationService from '@/services/notificationService';

export async function PUT(request: NextRequest, { params }: { params: { id: string; action: string } }) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const { id, action } = params;
    const app = await Application.findById(id).populate('property host user');
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    // Only host can take actions
    if ((app.host as any)._id.toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (action === 'accept') {
      app.status = 'accepted';
      app.reviewedAt = new Date();
      app.additionalNotes = body?.notes || app.additionalNotes;
      await app.save();
      // Notify applicant (in-app + optional SMS/WhatsApp/email)
      try {
        const applicant = app.user as any;
        await Notification.create({ user: applicant._id, type: 'application_accepted', message: `Your application for ${app.property.title} has been accepted.`, metadata: { applicationId: app._id, propertyId: app.property._id } });
        if (applicant?.phone) {
          const msg = `Your rental application for ${app.property.title} was accepted by the host.`;
          try { if (process.env.WHATSAPP_API_KEY) await NotificationService.sendWhatsApp(applicant.phone, msg); else if (process.env.TWILIO_SID) await NotificationService.sendSMS(applicant.phone, msg); } catch(e) { console.log('Applicant notify failed', e); }
        }
      } catch (nerr) { console.error('Failed to notify applicant', nerr); }
      return NextResponse.json({ message: 'Application accepted', data: app });
    }

    if (action === 'reject') {
      app.status = 'rejected';
      app.reviewedAt = new Date();
      app.additionalNotes = body?.reason || app.additionalNotes;
      await app.save();
      try {
        const applicant = app.user as any;
        await Notification.create({ user: applicant._id, type: 'application_rejected', message: `Your application for ${app.property.title} was rejected.`, metadata: { applicationId: app._id, propertyId: app.property._id } });
        if (applicant?.phone) {
          const msg = `Your rental application for ${app.property.title} was rejected by the host.`;
          try { if (process.env.WHATSAPP_API_KEY) await NotificationService.sendWhatsApp(applicant.phone, msg); else if (process.env.TWILIO_SID) await NotificationService.sendSMS(applicant.phone, msg); } catch(e) { console.log('Applicant notify failed', e); }
        }
      } catch (nerr) { console.error('Failed to notify applicant', nerr); }
      return NextResponse.json({ message: 'Application rejected', data: app });
    }

    if (action === 'request-info') {
      app.status = 'more_info';
      app.additionalNotes = body?.request || app.additionalNotes;
      await app.save();
      try {
        const applicant = app.user as any;
        await Notification.create({ user: applicant._id, type: 'application_more_info', message: `Host requested more information for your application for ${app.property.title}.`, metadata: { applicationId: app._id, propertyId: app.property._id } });
        if (applicant?.phone) {
          const msg = `Host requested more information for your application for ${app.property.title}. Please check your dashboard.`;
          try { if (process.env.WHATSAPP_API_KEY) await NotificationService.sendWhatsApp(applicant.phone, msg); else if (process.env.TWILIO_SID) await NotificationService.sendSMS(applicant.phone, msg); } catch(e) { console.log('Applicant notify failed', e); }
        }
      } catch (nerr) { console.error('Failed to notify applicant', nerr); }
      return NextResponse.json({ message: 'Requested more information', data: app });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Application action error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
