import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import RentService from '@/services/rentService';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import Rent from '@/models/Rent';
import User from '@/models/User';

const createRentSchema = z.object({
  propertyId: z.string().min(1),
  tenantId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(3).default('LKR'),
  frequency: z.enum(['monthly', 'weekly', 'yearly']).default('monthly'),
  firstDueDate: z.union([z.string(), z.date()]),
  leaseStartDate: z.union([z.string(), z.date()]).optional(),
  leaseEndDate: z.union([z.string(), z.date()]).optional(),
  securityDeposit: z.number().min(0).optional(),
  gracePeriodDays: z.number().int().min(0).max(60).optional(),
  notes: z.string().max(5000).optional(),
  applicationId: z.string().optional(),
}).strict();

const manualPaymentSchema = z.object({
  action: z.enum(['markPaid', 'markAsPaid']),
  rentId: z.string().min(1),
  method: z.enum(['manual', 'cash', 'bank-transfer', 'payhere', 'other']).optional(),
  providerReference: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  paidAt: z.union([z.string(), z.date()]).optional(),
}).strict();

function rolesFor(user: any): string[] {
  return Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
}

function isAdmin(user: any) {
  const roles = rolesFor(user);
  return roles.includes('admin') || roles.includes('super-admin');
}

async function hostOwnsProperty(userId: string, propertyId: string) {
  const property = await Property.findOne({ _id: propertyId, owner: userId }).select('_id');
  return Boolean(property);
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (body.action === 'markPaid' || body.action === 'markAsPaid') {
      const payment = manualPaymentSchema.safeParse(body);
      if (!payment.success) {
        return NextResponse.json({ ok: false, error: 'Invalid rent payment data' }, { status: 400 });
      }

      await dbConnect();
      const rent = await Rent.findById(payment.data.rentId).select('property');
      if (!rent) return NextResponse.json({ ok: false, error: 'Rent not found' }, { status: 404 });
      if (!isAdmin(user) && !(await hostOwnsProperty(user._id.toString(), rent.property.toString()))) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }

      const result = await RentService.markAsPaid(payment.data.rentId, user._id.toString(), {
        method: payment.data.method,
        providerReference: payment.data.providerReference,
        notes: payment.data.notes,
        paidAt: payment.data.paidAt,
      });
      return NextResponse.json({ ok: true, data: result });
    }

    const parsed = createRentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid rent agreement data' }, { status: 400 });
    }

    await dbConnect();
    if (!isAdmin(user) && !(await hostOwnsProperty(user._id.toString(), parsed.data.propertyId))) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const tenant = await User.findById(parsed.data.tenantId).select('_id');
    if (!tenant) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });

    const rent = await RentService.createRent(parsed.data);
    return NextResponse.json({ ok: true, data: rent }, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Rent POST error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const requestedUserId = url.searchParams.get('userId');
    const requestedHostId = url.searchParams.get('hostId');

    if (isAdmin(user)) {
      if (requestedUserId) {
        return NextResponse.json({ ok: true, rents: await RentService.listRentsForUser(requestedUserId) });
      }
      if (requestedHostId) {
        return NextResponse.json({ ok: true, rents: await RentService.listRentsForHost(requestedHostId) });
      }
    }

    const userId = user._id.toString();
    const roles = rolesFor(user);
    if (type === 'host') {
      if (!roles.includes('host') && !isAdmin(user)) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ ok: true, rents: await RentService.listRentsForHost(userId) });
    }

    return NextResponse.json({ ok: true, rents: await RentService.listRentsForUser(userId) });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Rent GET error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action !== 'triggerReminders') {
      return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }

    const configuredSecret = process.env.RENT_REMINDER_SECRET;
    const suppliedSecret = request.headers.get('x-cron-secret');
    let authorized = Boolean(configuredSecret && suppliedSecret && suppliedSecret === configuredSecret);

    if (!authorized) {
      const user = await requireAuth(request);
      authorized = isAdmin(user);
    }
    if (!authorized) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const daysBefore = Number.isFinite(Number(body.daysBefore))
      ? Math.min(Math.max(Number(body.daysBefore), 0), 30)
      : 3;
    const results = await RentService.triggerReminders({ daysBefore });
    return NextResponse.json({ ok: true, data: results });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Rent PATCH error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
