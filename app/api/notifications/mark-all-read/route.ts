import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/auth';

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
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
