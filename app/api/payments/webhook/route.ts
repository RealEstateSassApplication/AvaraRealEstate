import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Transaction from '@/models/Transaction';

export async function POST(req: Request) {
  // Note: In production verify webhook signatures (Stripe/PayHere)
  try {
    const payload = await req.text();
    // Minimal scaffold: parse JSON if possible
    let data: any = {};
    try { data = JSON.parse(payload); } catch (e) { data = { raw: payload }; }

    // Example: handle booking payment success from Stripe/PayHere
    if (data.type === 'payment_intent.succeeded' || data.event === 'payment.success') {
      const bookingId = data?.data?.object?.metadata?.bookingId || data?.bookingId;
      const providerId = data?.data?.object?.id || data?.transactionId;
      if (bookingId) {
        await dbConnect();
        await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed', paymentStatus: 'paid' });
        await Transaction.findOneAndUpdate({ booking: bookingId }, { status: 'completed', providerTransactionId: providerId });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
