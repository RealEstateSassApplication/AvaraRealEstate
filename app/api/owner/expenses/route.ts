import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import PropertyExpense from '@/models/PropertyExpense';

const expenseSchema = z.object({
  propertyId: z.string().min(1),
  category: z.enum(['maintenance', 'repairs', 'utilities', 'tax', 'insurance', 'management', 'capital', 'legal', 'other']),
  amount: z.number().positive(),
  currency: z.string().trim().length(3).optional(),
  incurredAt: z.union([z.string(), z.date()]).optional(),
  description: z.string().trim().min(2).max(2000),
  vendor: z.string().trim().max(200).optional(),
  receiptUrl: z.string().trim().max(1000).optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
}).strict();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await dbConnect();
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));

    const query: any = { owner: user._id, status: 'recorded' };
    if (propertyId) query.property = propertyId;

    const expenses = await PropertyExpense.find(query)
      .sort({ incurredAt: -1 })
      .limit(limit)
      .populate('property', 'title address currency images')
      .lean();

    return NextResponse.json({ ok: true, data: expenses });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner expenses GET error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to load expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const parsed = expenseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid expense data', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findOne({ _id: parsed.data.propertyId, owner: user._id }).select('_id currency');
    if (!property) return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });

    const incurredAt = parsed.data.incurredAt ? new Date(parsed.data.incurredAt) : new Date();
    if (Number.isNaN(incurredAt.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid expense date' }, { status: 400 });
    }

    if (parsed.data.recurring && !parsed.data.recurringInterval) {
      return NextResponse.json({ ok: false, error: 'Recurring interval is required for recurring expenses' }, { status: 400 });
    }

    const expense = await PropertyExpense.create({
      property: property._id,
      owner: user._id,
      category: parsed.data.category,
      amount: parsed.data.amount,
      currency: (parsed.data.currency || property.currency || 'LKR').toUpperCase(),
      incurredAt,
      description: parsed.data.description,
      vendor: parsed.data.vendor,
      receiptUrl: parsed.data.receiptUrl,
      recurring: Boolean(parsed.data.recurring),
      recurringInterval: parsed.data.recurring ? parsed.data.recurringInterval : undefined,
      status: 'recorded',
    });

    return NextResponse.json({ ok: true, data: expense }, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner expenses POST error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to record expense' }, { status: 500 });
  }
}
