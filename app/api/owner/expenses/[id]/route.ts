import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import PropertyExpense from '@/models/PropertyExpense';

const updateSchema = z.object({
  category: z.enum(['maintenance', 'repairs', 'utilities', 'tax', 'insurance', 'management', 'capital', 'legal', 'other']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().trim().length(3).optional(),
  incurredAt: z.union([z.string(), z.date()]).optional(),
  description: z.string().trim().min(2).max(2000).optional(),
  vendor: z.string().trim().max(200).optional(),
  receiptUrl: z.string().trim().max(1000).optional(),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid expense update' }, { status: 400 });
    }

    await dbConnect();
    const expense = await PropertyExpense.findOne({ _id: params.id, owner: user._id, status: 'recorded' });
    if (!expense) return NextResponse.json({ ok: false, error: 'Expense not found' }, { status: 404 });

    if (parsed.data.incurredAt !== undefined) {
      const date = new Date(parsed.data.incurredAt);
      if (Number.isNaN(date.getTime())) return NextResponse.json({ ok: false, error: 'Invalid expense date' }, { status: 400 });
      expense.incurredAt = date;
    }
    if (parsed.data.category !== undefined) expense.category = parsed.data.category;
    if (parsed.data.amount !== undefined) expense.amount = parsed.data.amount;
    if (parsed.data.currency !== undefined) expense.currency = parsed.data.currency.toUpperCase();
    if (parsed.data.description !== undefined) expense.description = parsed.data.description;
    if (parsed.data.vendor !== undefined) expense.vendor = parsed.data.vendor;
    if (parsed.data.receiptUrl !== undefined) expense.receiptUrl = parsed.data.receiptUrl;
    if (parsed.data.recurring !== undefined) expense.recurring = parsed.data.recurring;
    if (parsed.data.recurringInterval !== undefined) expense.recurringInterval = parsed.data.recurringInterval;
    if (!expense.recurring) expense.recurringInterval = undefined;

    await expense.save();
    return NextResponse.json({ ok: true, data: expense });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner expense PATCH error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await dbConnect();
    const expense = await PropertyExpense.findOneAndUpdate(
      { _id: params.id, owner: user._id, status: 'recorded' },
      { status: 'void' },
      { new: true }
    );
    if (!expense) return NextResponse.json({ ok: false, error: 'Expense not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner expense DELETE error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to void expense' }, { status: 500 });
  }
}
