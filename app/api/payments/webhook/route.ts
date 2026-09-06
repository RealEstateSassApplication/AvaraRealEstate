import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Transaction from '@/models/Transaction';
import BookingService from '@/services/bookingService';
import { verifyPayHereSignature } from '@/lib/security';

function readField(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const merchantId = readField(form, 'merchant_id');
    const bookingId = readField(form, 'order_id');
    const paymentId = readField(form, 'payment_id');
    const amount = readField(form, 'payhere_amount');
    const currency = readField(form, 'payhere_currency').toUpperCase();
    const statusCode = readField(form, 'status_code');
    const signature = readField(form, 'md5sig');

    if (!merchantId || !bookingId || !amount || !currency || !statusCode || !signature) {
      return NextResponse.json({ error: 'Invalid payment notification' }, { status: 400 });
    }

    if (!verifyPayHereSignature({
      merchantId,
      orderId: bookingId,
      amount,
      currency,
      statusCode,
      signature,
    })) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking reference' }, { status: 400 });
    }

    await dbConnect();
    const booking = await Booking.findById(bookingId).select('totalAmount currency status paymentStatus');
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const notifiedAmount = Number(amount);
    const expectedAmount = Number(booking.totalAmount);
    if (!Number.isFinite(notifiedAmount) || Math.abs(notifiedAmount - expectedAmount) > 0.01) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }
    if (String(booking.currency || 'LKR').toUpperCase() !== currency) {
      return NextResponse.json({ error: 'Payment currency mismatch' }, { status: 400 });
    }

    // PayHere status 2 means payment success. Other valid statuses must never
    // confirm the booking, but we record the failed/cancelled transaction state.
    if (statusCode !== '2') {
      await Transaction.findOneAndUpdate(
        { booking: booking._id },
        {
          status: 'failed',
          provider: 'payhere',
          ...(paymentId ? { providerTransactionId: paymentId } : {}),
          $set: { 'metadata.payhereStatusCode': statusCode },
        }
      );
      return NextResponse.json({ received: true });
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing PayHere payment id' }, { status: 400 });
    }

    const duplicatePayment = await Transaction.findOne({
      provider: 'payhere',
      providerTransactionId: paymentId,
      booking: { $ne: booking._id },
    }).select('_id');
    if (duplicatePayment) {
      return NextResponse.json({ error: 'Payment id already used' }, { status: 409 });
    }

    const transaction = await Transaction.findOne({ booking: booking._id });
    if (
      transaction?.status === 'completed' &&
      transaction.providerTransactionId === paymentId &&
      booking.paymentStatus === 'paid'
    ) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    await BookingService.confirmBooking(bookingId, paymentId);
    await Transaction.findOneAndUpdate(
      { booking: booking._id },
      {
        status: 'completed',
        provider: 'payhere',
        providerTransactionId: paymentId,
        $set: { 'metadata.payhereStatusCode': statusCode },
      }
    );

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Payment notification failed' }, { status: 500 });
  }
}
