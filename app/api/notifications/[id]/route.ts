import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';

function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Authentication')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return null;
}

// Mark one notification as read.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({ message: 'Notification marked as read', data: notification });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// Backward-compatible mark-all handler for callers that still PUT to /api/notifications/:id.
// The dedicated /api/notifications/mark-all-read endpoint is preferred.
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await dbConnect();

    const result = await Notification.updateMany(
      { user: user._id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({
      message: 'All notifications marked as read',
      updated: result.modifiedCount,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
