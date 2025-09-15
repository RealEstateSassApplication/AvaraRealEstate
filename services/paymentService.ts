import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export default class PaymentService {
  static async createStripePaymentIntent({ amount, currency = 'LKR', bookingId }: { amount: number; currency?: string; bookingId?: string }) {
    // amount in smallest currency unit (e.g., cents)
    const intent = await stripe.paymentIntents.create({ amount: Math.round(amount), currency: currency.toLowerCase(), metadata: { bookingId } });
    return intent;
  }

  static async recordTransaction(data: any) {
    await dbConnect();
    const tx = await Transaction.create(data);
    return tx;
  }
}
