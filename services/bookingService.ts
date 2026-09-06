import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Transaction from '@/models/Transaction';

export interface CreateBookingInput {
  propertyId: string;
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  guestCount?: number;
  guestDetails?: { adults: number; children: number };
  specialRequests?: string;
}

function parseDate(value: string | Date) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid dates');
  return date;
}

function getNightDates(start: Date, end: Date) {
  const dates: Date[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor < endDay) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function calculateTotal(property: any, nights: number) {
  const baseAmount = Number(property.price) * nights;
  let discount = 0;

  if (nights >= 30 && Number(property.pricing?.monthlyDiscount) > 0) {
    discount = Number(property.pricing.monthlyDiscount);
  } else if (nights >= 7 && Number(property.pricing?.weeklyDiscount) > 0) {
    discount = Number(property.pricing.weeklyDiscount);
  }

  const discounted = baseAmount * (1 - discount / 100);
  const cleaningFee = Math.max(0, Number(property.pricing?.cleaningFee) || 0);
  return Math.round((discounted + cleaningFee) * 100) / 100;
}

async function hasOverlap(propertyId: string, start: Date, end: Date) {
  await dbConnect();
  return Booking.findOne({
    property: propertyId,
    status: { $in: ['pending', 'confirmed'] },
    startDate: { $lt: end },
    endDate: { $gt: start },
  }).select('_id');
}

export default class BookingService {
  static async checkAvailability(propertyId: string, startDate: Date | string, endDate: Date | string) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (start >= end) throw new Error('Invalid dates');
    const conflict = await hasOverlap(propertyId, start, end);
    return !conflict;
  }

  static async createBooking(payload: CreateBookingInput) {
    await dbConnect();

    const start = parseDate(payload.startDate);
    const end = parseDate(payload.endDate);
    if (start >= end) throw new Error('Invalid dates');

    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (!Number.isFinite(nights) || nights < 1) throw new Error('Invalid dates');

    const nightDates = getNightDates(start, end);
    if (!nightDates.length) throw new Error('Invalid dates');

    const initialProperty = await Property.findById(payload.propertyId).select('status');
    if (!initialProperty) throw new Error('Property not found');
    if (initialProperty.status !== 'active') throw new Error('Property not available');

    // Existing bookings remain the source of truth. This also protects against
    // legacy records created before atomic calendar reservations were introduced.
    if (await hasOverlap(payload.propertyId, start, end)) {
      throw new Error('Property not available for selected dates');
    }

    // Reserve all nights in a single atomic property update. Concurrent callers
    // attempting to reserve any of the same normalized dates cannot both succeed.
    const property = await Property.findOneAndUpdate(
      {
        _id: payload.propertyId,
        status: 'active',
        'calendar.blockedDates': { $nin: nightDates },
        'calendar.bookedDates': { $nin: nightDates },
      },
      { $addToSet: { 'calendar.blockedDates': { $each: nightDates } } },
      { new: true }
    ).populate('owner');

    if (!property) throw new Error('Property not available for selected dates');

    let booking: any = null;
    try {
      const totalAmount = calculateTotal(property, nights);
      const currency = String(property.currency || 'LKR').toUpperCase();
      const guestCount = Math.max(1, Math.floor(Number(payload.guestCount) || 1));
      const guestDetails = {
        adults: Math.max(1, Math.floor(Number(payload.guestDetails?.adults) || guestCount)),
        children: Math.max(0, Math.floor(Number(payload.guestDetails?.children) || 0)),
      };

      booking = await Booking.create({
        property: payload.propertyId,
        user: payload.userId,
        host: (property.owner as any)._id,
        startDate: start,
        endDate: end,
        nights,
        totalAmount,
        currency,
        guestCount,
        guestDetails,
        specialRequests: payload.specialRequests,
        status: 'pending',
        paymentStatus: 'pending',
      });

      const transaction = await Transaction.create({
        booking: booking._id,
        from: payload.userId,
        to: (property.owner as any)._id,
        amount: totalAmount,
        currency,
        type: 'booking',
        provider: 'payhere',
        providerTransactionId: '',
        status: 'pending',
      });

      return { booking, transaction };
    } catch (err) {
      if (booking?._id) {
        await Booking.findByIdAndDelete(booking._id).catch(() => undefined);
      }
      await Property.findByIdAndUpdate(payload.propertyId, {
        $pullAll: { 'calendar.blockedDates': nightDates },
      }).catch(() => undefined);
      console.error('Booking creation failed:', err);
      throw err;
    }
  }

  static async confirmBooking(
    bookingId: string,
    options: { markPaid?: boolean; providerTransactionId?: string } = {}
  ) {
    await dbConnect();
    const update: any = { status: 'confirmed' };
    if (options.markPaid) update.paymentStatus = 'paid';

    const booking = await Booking.findByIdAndUpdate(bookingId, update, { new: true })
      .populate('property user host');

    if (booking) {
      const nightDates = getNightDates(new Date(booking.startDate), new Date(booking.endDate));
      const propertyId = (booking.property as any)._id || booking.property;
      await Property.findByIdAndUpdate(propertyId, {
        $addToSet: { 'calendar.bookedDates': { $each: nightDates } },
        $pullAll: { 'calendar.blockedDates': nightDates },
      });
    }
    return booking;
  }

  static async cancelBooking(bookingId: string, userId: string, reason?: string) {
    await dbConnect();
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) return null;

    const nightDates = getNightDates(new Date(booking.startDate), new Date(booking.endDate));
    await Property.findByIdAndUpdate(booking.property, {
      $pullAll: {
        'calendar.blockedDates': nightDates,
        'calendar.bookedDates': nightDates,
      },
    });

    return Booking.findByIdAndUpdate(
      bookingId,
      { status: 'cancelled', cancellationReason: reason },
      { new: true }
    );
  }

  static async getBookingsByUser(userId: string, page = 1, limit = 10) {
    await dbConnect();
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;
    const [bookings, total] = await Promise.all([
      Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('property', 'title images address price currency')
        .populate('host', 'name profilePhoto')
        .lean(),
      Booking.countDocuments({ user: userId }),
    ]);
    return { bookings, total, totalPages: Math.ceil(total / safeLimit) };
  }

  static async getBookingsByHost(hostId: string, page = 1, limit = 10) {
    await dbConnect();
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;
    const [bookings, total] = await Promise.all([
      Booking.find({ host: hostId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate('property', 'title images address price currency')
        .populate('user', 'name profilePhoto')
        .lean(),
      Booking.countDocuments({ host: hostId }),
    ]);
    return { bookings, total, totalPages: Math.ceil(total / safeLimit) };
  }
}
