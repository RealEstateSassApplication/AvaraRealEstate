import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import {supabaseMode} from '@/lib/supabase-auth';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address } = body;

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update fields
    if (name) updatedUser.name = name;
    if (email && email!==user.email && supabaseMode())return NextResponse.json({error:'Email changes require the authentication provider.'},{status:409});
    if (email) updatedUser.email = email;
    if (phone) updatedUser.phone = phone;
    if (address) updatedUser.address = address;

    await updatedUser.save();

    return NextResponse.json({ ok: true, user: {id:updatedUser._id,name:updatedUser.name,email:updatedUser.email,phone:updatedUser.phone,address:updatedUser.address} });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
