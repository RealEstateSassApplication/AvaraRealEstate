import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Notification from '@/models/Notification';

const contactSchema = z.object({
  message: z.string().trim().min(5).max(2000),
}).strict();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid message' }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findOne({ _id: params.id, status: 'active' })
      .select('_id owner title');
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    if (property.owner.toString() === user._id.toString()) {
      return NextResponse.json({ error: 'You own this property' }, { status: 400 });
    }

    await Notification.create({
      user: property.owner,
      type: 'property_contact_request',
      message: `${user.name || 'A user'} is interested in ${property.title}`,
      metadata: {
        propertyId: property._id,
        requesterId: user._id,
        requesterName: user.name,
        requesterEmail: user.email,
        requesterPhone: user.phone,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your enquiry was sent to the property owner',
    });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('Contact host error:', err);
    return NextResponse.json({ error: 'Failed to send enquiry' }, { status: 500 });
  }
}
