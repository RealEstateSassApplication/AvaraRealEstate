import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import { eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';

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

export interface BookingCalendarEntry {
  date: Date;
  status: 'available' | 'booked' | 'blocked' | 'maintenance';
  bookingId?: string;
  price?: number;
}

async function hasOverlap(propertyId: string, start: Date, end: Date, excludeBookingId?: string) {
  await dbConnect();
  const query: any = {
    property: propertyId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [{ startDate: { $lt: end }, endDate: { $gt: start } }]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  return await Booking.findOne(query).select('_id');
}

export default class BookingService {
  // Enhanced availability checking with detailed calendar view
  static async getAvailabilityCalendar(propertyId: string, startDate: Date | string, endDate: Date | string) {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!(start instanceof Date) || !(end instanceof Date) || start >= end) {
      throw new Error('Invalid date range');
    }

    await dbConnect();
    
    // Get property to check blocked dates
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    // Get all bookings in the date range
    const bookings = await Booking.find({
      property: propertyId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    // Generate calendar entries for each day
    const calendar: BookingCalendarEntry[] = [];
    const allDates = eachDayOfInterval({ start, end });

    for (const date of allDates) {
      let status: BookingCalendarEntry['status'] = 'available';
      let bookingId: string | undefined;
      let price = property.price;

      // Check if date is blocked by property owner
      const isBlocked = property.calendar?.blockedDates?.some((blockedDate: Date) => 
        blockedDate.toDateString() === date.toDateString()
      );

      if (isBlocked) {
        status = 'blocked';
      } else {
        // Check if date is booked
        const booking = bookings.find(b => 
          isWithinInterval(date, { start: new Date(b.startDate), end: new Date(b.endDate) })
        );

        if (booking) {
          status = booking.status === 'confirmed' ? 'booked' : 'booked';
          bookingId = booking._id.toString();
        }
      }

      calendar.push({ date, status, bookingId, price });
    }

    return calendar;
  }

  static async checkAvailability(propertyId: string, startDate: Date | string, endDate: Date | string) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    if (!(start instanceof Date) || !(end instanceof Date) || start >= end) throw new Error('Invalid dates');
    const conflict = await hasOverlap(propertyId, start, end);
    return !conflict;
  }

  // Enhanced booking creation with better validation
  static async createBooking(payload: CreateBookingInput) {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const property = await Property.findById(payload.propertyId).populate('owner');
      if (!property) throw new Error('Property not found');
      if (property.status !== 'active') throw new Error('Property not available for booking');

      // Enhanced availability check
      const available = await this.checkAvailability(
        (property._id as any).toString(), 
        payload.startDate, 
        payload.endDate
      );
      if (!available) throw new Error('Property not available for selected dates');

      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate total amount with potential discounts
      let baseAmount = property.price * nights;
      let totalAmount = payload.totalAmount || baseAmount;
      
      // Apply discounts if applicable
      if (property.pricing) {
        if (nights >= 7 && property.pricing.weeklyDiscount) {
          totalAmount = baseAmount * (1 - property.pricing.weeklyDiscount / 100);
        } else if (nights >= 30 && property.pricing.monthlyDiscount) {
          totalAmount = baseAmount * (1 - property.pricing.monthlyDiscount / 100);
        }
        
        // Add cleaning fee and security deposit
        if (property.pricing.cleaningFee) {
          totalAmount += property.pricing.cleaningFee;
        }
      }

      const bookingDoc = {
        property: payload.propertyId,
        user: payload.userId,
        host: (property.owner as any)._id,
        startDate: start,
        endDate: end,
        nights,
        totalAmount: Math.round(totalAmount),
        currency: payload.currency || property.currency || 'LKR',
        guestCount: payload.guestCount || 1,
        guestDetails: payload.guestDetails || { adults: 1, children: 0 },
        specialRequests: payload.specialRequests,
        status: 'pending',
        paymentStatus: 'pending'
      } as any;

      const [booking] = await Booking.create([bookingDoc], { session });
      
      // Create transaction record
      const [transaction] = await Transaction.create([{
        booking: booking._id,
        from: payload.userId,
        to: (property.owner as any)._id,
        amount: Math.round(totalAmount),
        currency: payload.currency || 'LKR',
        type: 'booking',
        provider: payload.provider || 'manual',
        providerTransactionId: payload.providerTransactionId || '',
        status: 'pending'
      }], { session });

      // Block dates temporarily
      const datesToBlock = eachDayOfInterval({ start, end });
      await Property.findByIdAndUpdate(
        property._id, 
        { $addToSet: { 'calendar.blockedDates': { $each: datesToBlock } } }, 
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      
      return { booking, transaction };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // Enhanced booking confirmation with automatic rent creation for long-term stays
  static async confirmBooking(bookingId: string, transactionId?: string) {
    await dbConnect();
    const booking = await Booking.findByIdAndUpdate(
      bookingId, 
      { status: 'confirmed', paymentStatus: 'paid' }, 
      { new: true }
    ).populate('property user host');
    
    if (booking) {
      const datesToBook = eachDayOfInterval({ start: booking.startDate, end: booking.endDate });
      await Property.findByIdAndUpdate(
        (booking.property as any)._id || booking.property, 
        { 
          $addToSet: { 'calendar.bookedDates': { $each: datesToBook } }, 
          $pullAll: { 'calendar.blockedDates': datesToBook } 
        }
      );

      // If booking is for more than 30 days, consider creating a rent agreement
      if (booking.nights >= 30) {
        // This could trigger rent creation logic
        console.log('Long-term booking detected, consider creating rent agreement');
      }
    }
    
    return booking;
  }

  static async cancelBooking(bookingId: string, userId: string, reason?: string) {
    await dbConnect();
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) return null;
    
    const datesToUnblock = eachDayOfInterval({ start: booking.startDate, end: booking.endDate });
    await Property.findByIdAndUpdate(booking.property, { 
      $pullAll: { 
        'calendar.blockedDates': datesToUnblock, 
        'calendar.bookedDates': datesToUnblock 
      } 
    });
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId, 
      { status: 'cancelled', cancellationReason: reason }, 
      { new: true }
    );
    
    return updatedBooking;
  }

  static async getBookingsByUser(userId: string, page = 1, limit = 10) {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('property', 'title images address price currency')
        .populate('host', 'name profilePhoto')
        .lean(),
      Booking.countDocuments({ user: userId })
    ]);
    return { bookings, total, totalPages: Math.ceil(total / limit) };
  }

  static async getBookingsByHost(hostId: string, page = 1, limit = 10) {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find({ host: hostId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('property', 'title images address price currency')
        .populate('user', 'name profilePhoto')
        .lean(),
      Booking.countDocuments({ host: hostId })
    ]);
    return { bookings, total, totalPages: Math.ceil(total / limit) };
  }

  // Get booking statistics for dashboard
  static async getBookingStats(hostId?: string, userId?: string) {
    await dbConnect();
    
    const matchFilter: any = {};
    if (hostId) matchFilter.host = hostId;
    if (userId) matchFilter.user = userId;

    const stats = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: { 
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } 
          },
          pendingBookings: { 
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
          },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] }, 
                '$totalAmount', 
                0
              ] 
            } 
          },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    return stats[0] || {
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0
    };
  }
}