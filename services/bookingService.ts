import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import { eachDayOfInterval } from 'date-fns';

export interface CreateBookingInput {
  propertyId: string;
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  guestCount?: number;
  totalAmount?: number;
  guestDetails?: { adults: number; children: number };
  specialRequests?: string;
  currency?: string;
  provider?: string;
  providerTransactionId?: string;
}

async function hasOverlap(propertyId: string, start: Date, end: Date) {
  await dbConnect();
  return await Booking.findOne({
    property: propertyId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [{ startDate: { $lt: end }, endDate: { $gt: start } }]
  }).select('_id');
}

export default class BookingService {
  static async checkAvailability(propertyId: string, startDate: Date | string, endDate: Date | string) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    if (!(start instanceof Date) || !(end instanceof Date) || start >= end) throw new Error('Invalid dates');
    const conflict = await hasOverlap(propertyId, start, end);
    return !conflict;
  }

  static async createBooking(payload: CreateBookingInput) {
    await dbConnect();

    try {
      const property = await Property.findById(payload.propertyId).populate('owner');
      if (!property) throw new Error('Property not found');
      // Status check: allow active properties
      if (property.status !== 'active') throw new Error('Property not available');

      const available = await this.checkAvailability((property._id as any).toString(), payload.startDate, payload.endDate);
      if (!available) throw new Error('Property not available for selected dates');

      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = typeof payload.totalAmount === 'number' ? payload.totalAmount : property.price * nights;

      const bookingDoc = {
        property: payload.propertyId,
        user: payload.userId,
        host: (property.owner as any)._id,
        startDate: start,
        endDate: end,
        nights,
        totalAmount,
        currency: payload.currency || property.currency || 'LKR',
        guestCount: payload.guestCount || 1,
        guestDetails: payload.guestDetails || { adults: 1, children: 0 },
        specialRequests: payload.specialRequests,
        status: 'pending',
        paymentStatus: 'pending'
      } as any;

      const booking = await Booking.create(bookingDoc);
      const tx = await Transaction.create({ booking: booking._id, from: payload.userId, to: (property.owner as any)._id, amount: totalAmount, currency: payload.currency || 'LKR', type: 'booking', provider: payload.provider || 'manual', providerTransactionId: payload.providerTransactionId || '', status: 'pending' });

      // Block dates temporarily
      const datesToBlock = eachDayOfInterval({ start, end });
      await Property.findByIdAndUpdate(property._id, { $addToSet: { 'calendar.blockedDates': { $each: datesToBlock } } });

      return { booking, transaction: tx };
    } catch (err) {
      console.error("Booking creation failed:", err);
      throw err;
    }
  }

  static async confirmBooking(bookingId: string, transactionId?: string) {
    await dbConnect();
    const booking = await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed', paymentStatus: 'paid' }, { new: true }).populate('property user host');
    if (booking) {
      const datesToBook = eachDayOfInterval({ start: booking.startDate, end: booking.endDate });
      await Property.findByIdAndUpdate((booking.property as any)._id || booking.property, { $addToSet: { 'calendar.bookedDates': { $each: datesToBook } }, $pullAll: { 'calendar.blockedDates': datesToBook } });
    }
    return booking;
  }

  static async cancelBooking(bookingId: string, userId: string, reason?: string) {
    await dbConnect();
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) return null;
    const datesToUnblock = eachDayOfInterval({ start: booking.startDate, end: booking.endDate });
    await Property.findByIdAndUpdate(booking.property, { $pullAll: { 'calendar.blockedDates': datesToUnblock, 'calendar.bookedDates': datesToUnblock } });
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled', cancellationReason: reason }, { new: true });
    return updatedBooking;
  }

  static async getBookingsByUser(userId: string, page = 1, limit = 10) {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('property', 'title images address price currency').populate('host', 'name profilePhoto').lean(),
      Booking.countDocuments({ user: userId })
    ]);
    return { bookings, total, totalPages: Math.ceil(total / limit) };
  }

  static async getBookingsByHost(hostId: string, page = 1, limit = 10) {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find({ host: hostId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('property', 'title images address price currency').populate('user', 'name profilePhoto').lean(),
      Booking.countDocuments({ host: hostId })
    ]);
    return { bookings, total, totalPages: Math.ceil(total / limit) };
  }
}