import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';

// Mark notification as read
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const { id } = params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Ensure user owns this notification
    if (notification.user.toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({ message: 'Notification marked as read', data: notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);

    await Notification.updateMany(
      { user: (user as any)._id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
