import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Application from '@/models/Application';
import Property from '@/models/Property';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const app = await Application.findById(params.id)
      .populate('property', 'title address price images')
      .populate('user', 'name email phone')
      .lean();
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    // Only host or applicant may view the application
    const uid = (user as any)._id;
    if (app.host?.toString() !== uid.toString() && app.user?.toString() !== uid.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: app });
  } catch (err: any) {
    console.error('Application GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const app = await Application.findById(params.id);
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const uid = (user as any)._id;
    // Allow deletion by host or the applicant
    const isHost = app.host?.toString() === uid.toString();
    const isApplicant = app.user?.toString() === uid.toString();
    if (!isHost && !isApplicant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await Application.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true, message: 'Application deleted' });
  } catch (err: any) {
    console.error('Application DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
