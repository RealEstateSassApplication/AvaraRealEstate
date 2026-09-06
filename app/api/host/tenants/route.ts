import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, requireRole } from '@/lib/auth';

const tenantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
}).strict();

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['host', 'admin', 'super-admin']);
    const parsed = tenantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid tenant details' }, { status: 400 });
    }

    await dbConnect();
    const email = parsed.data.email.toLowerCase();
    const phone = parsed.data.phone;
    const existing = await User.findOne({
      $or: [{ email }, { phone }],
    }).select('_id name email phone role roles');

    if (existing) {
      // Do not reveal a different phone/email merely because one identifier
      // matched. The host must provide the exact existing identity pair.
      if (String(existing.email).toLowerCase() !== email || String(existing.phone) !== phone) {
        return NextResponse.json(
          { error: 'A user already exists with one of these contact details' },
          { status: 409 }
        );
      }

      return NextResponse.json({
        user: {
          _id: existing._id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
        },
        existing: true,
      });
    }

    // Placeholder credentials are never returned. The tenant should set their own
    // password through the account activation/reset flow before signing in.
    const temporaryPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await hashPassword(temporaryPassword);
    const tenant = await User.create({
      name: parsed.data.name,
      email,
      phone,
      passwordHash,
      role: 'tenant',
      roles: ['user', 'tenant'],
      verified: false,
      emailVerified: false,
      phoneVerified: false,
    });

    return NextResponse.json({
      user: { _id: tenant._id, name: tenant.name, email: tenant.email, phone: tenant.phone },
      existing: false,
    }, { status: 201 });
  } catch (err: any) {
    const message = err?.message || 'Internal server error';
    if (message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (message.includes('permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Tenant provisioning error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
