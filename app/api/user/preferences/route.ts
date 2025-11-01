import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notifications, currency, language } = body;

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update preferences
    if (notifications) {
      updatedUser.preferences = updatedUser.preferences || {};
      updatedUser.preferences.notifications = notifications;
    }
    if (currency) {
      updatedUser.preferences = updatedUser.preferences || {};
      updatedUser.preferences.currency = currency;
    }
    if (language) {
      updatedUser.preferences = updatedUser.preferences || {};
      updatedUser.preferences.language = language;
    }

    await updatedUser.save();

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: error.message || 'Failed to update preferences' }, { status: 500 });
  }
}
