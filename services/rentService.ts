import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import RentPayment from '@/models/RentPayment';
import NotificationService from './notificationService';
import User from '@/models/User';
import Property from '@/models/Property';
import Application from '@/models/Application';

type CreateRentInput = {
  propertyId: string;
  tenantId: string;
  amount: number;
  currency?: string;
  frequency?: 'monthly' | 'weekly' | 'yearly';
  firstDueDate: string | Date;
  leaseStartDate?: string | Date;
  leaseEndDate?: string | Date;
  securityDeposit?: number;
  gracePeriodDays?: number;
  notes?: string;
  applicationId?: string;
};

type RecordPaymentInput = {
  method?: 'manual' | 'cash' | 'bank-transfer' | 'payhere' | 'other';
  providerReference?: string;
  notes?: string;
  paidAt?: string | Date;
};

function nextDueDate(current: Date, frequency: 'monthly' | 'weekly' | 'yearly') {
  const next = new Date(current);
  if (frequency === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1);
  else if (frequency === 'weekly') next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

export default class RentService {
  static async createRent(payload: CreateRentInput) {
    await dbConnect();

    const firstDueDate = new Date(payload.firstDueDate);
    if (Number.isNaN(firstDueDate.getTime())) throw new Error('Invalid first due date');

    const leaseStartDate = payload.leaseStartDate ? new Date(payload.leaseStartDate) : firstDueDate;
    const leaseEndDate = payload.leaseEndDate ? new Date(payload.leaseEndDate) : undefined;
    if (Number.isNaN(leaseStartDate.getTime())) throw new Error('Invalid lease start date');
    if (leaseEndDate && Number.isNaN(leaseEndDate.getTime())) throw new Error('Invalid lease end date');
    if (leaseEndDate && leaseEndDate <= leaseStartDate) throw new Error('Lease end date must be after start date');

    const rent = await Rent.create({
      property: payload.propertyId,
      tenant: payload.tenantId,
      amount: payload.amount,
      currency: (payload.currency || 'LKR').toUpperCase(),
      frequency: payload.frequency || 'monthly',
      nextDue: firstDueDate,
      leaseStartDate,
      leaseEndDate,
      securityDeposit: Math.max(0, Number(payload.securityDeposit) || 0),
      depositStatus: Number(payload.securityDeposit) > 0 ? 'pending' : 'not-required',
      gracePeriodDays: Math.min(60, Math.max(0, Number(payload.gracePeriodDays) || 0)),
      notes: payload.notes || ''
    });

    let appId = payload.applicationId;
    if (!appId) {
      const matchingApp = await Application.findOne({
        property: payload.propertyId,
        user: payload.tenantId,
        status: { $in: ['pending', 'accepted', 'more_info'] }
      }).sort({ createdAt: -1 });
      if (matchingApp) appId = matchingApp._id.toString();
    }

    // Preserve application history for the owner/tenant audit trail instead of
    // deleting the application after converting it into a lease.
    if (appId) {
      await Application.findByIdAndUpdate(appId, {
        status: 'accepted',
        reviewedAt: new Date(),
        rentAgreement: rent._id
      }).catch((err) => console.error('Failed to link application to rent:', err));
    }

    return rent;
  }

  static async listRentsForUser(userId: string) {
    await dbConnect();
    return Rent.find({ tenant: userId })
      .sort({ status: 1, nextDue: 1 })
      .populate('property')
      .lean();
  }

  static async listRentsForHost(hostId: string) {
    await dbConnect();
    const properties = await Property.find({ owner: hostId }).select('_id').lean();
    const ids = properties.map((property) => property._id);
    return Rent.find({ property: { $in: ids } })
      .sort({ status: 1, nextDue: 1 })
      .populate('tenant property')
      .lean();
  }

  static async markAsPaid(rentId: string, recordedBy: string, input: RecordPaymentInput = {}) {
    await dbConnect();
    const rent = await Rent.findById(rentId).populate('property');
    if (!rent) throw new Error('Rent not found');
    if (rent.status !== 'active') throw new Error('Only active rent agreements can receive payments');

    const property = rent.property as any;
    const dueDate = new Date(rent.nextDue);
    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    if (Number.isNaN(paidAt.getTime())) throw new Error('Invalid payment date');

    const existing = await RentPayment.findOne({ rent: rent._id, dueDate, status: 'paid' });
    if (existing) {
      return { rent, payment: existing, duplicate: true };
    }

    let payment: any;
    try {
      payment = await RentPayment.create({
        rent: rent._id,
        property: property._id || property,
        tenant: rent.tenant,
        host: property.owner,
        amount: rent.amount,
        currency: rent.currency || 'LKR',
        dueDate,
        paidAt,
        method: input.method || 'manual',
        providerReference: input.providerReference || undefined,
        notes: input.notes,
        recordedBy
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        const duplicate = await RentPayment.findOne({ rent: rent._id, dueDate, status: 'paid' });
        if (duplicate) return { rent, payment: duplicate, duplicate: true };
      }
      throw err;
    }

    rent.nextDue = nextDueDate(dueDate, rent.frequency);
    rent.lastPaidAt = paidAt;
    rent.totalPaid = (Number(rent.totalPaid) || 0) + Number(rent.amount);
    rent.paymentsCount = (Number(rent.paymentsCount) || 0) + 1;
    rent.lastReminderAt = undefined as any;
    rent.remindersSent = 0;
    await rent.save();

    return { rent, payment, duplicate: false };
  }

  static async triggerReminders({ daysBefore = 3 } = {}) {
    await dbConnect();
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysBefore);

    const rents = await Rent.find({ status: 'active', nextDue: { $lte: threshold } }).populate('tenant property');
    const results: Array<{ rentId: string; sent: boolean; error?: string }> = [];

    for (const rent of rents) {
      try {
        const tenant = (rent.tenant as any) || await User.findById((rent.tenant as any)).lean();
        const property = (rent.property as any) || await Property.findById((rent.property as any)).lean();
        const phone = tenant?.phone || tenant?.mobile || tenant?.phoneNumber;
        const due = new Date(rent.nextDue);
        const overdue = due < now;
        const message = `${overdue ? 'Overdue rent' : 'Rent reminder'}: ${rent.amount} ${rent.currency} for ${property?.title || property?.address?.city || 'your property'} ${overdue ? 'was due' : 'is due'} on ${due.toLocaleDateString()}.`;

        if (phone && process.env.ENABLE_SMS !== 'false') {
          await NotificationService.sendSMS(phone, message);
        } else if (phone && process.env.ENABLE_WHATSAPP !== 'false') {
          await NotificationService.sendWhatsApp(phone, message);
        }

        rent.lastReminderAt = new Date();
        rent.remindersSent = (rent.remindersSent || 0) + 1;
        await rent.save();
        results.push({ rentId: rent._id.toString(), sent: true });
      } catch (err: any) {
        results.push({ rentId: rent._id.toString(), sent: false, error: err.message });
      }
    }

    return results;
  }

  static async sendReminderForRent(rentId: string) {
    await dbConnect();
    const rent = await Rent.findById(rentId).populate('tenant property');
    if (!rent) throw new Error('Rent not found');

    const tenant = rent.tenant as any;
    const property = rent.property as any;
    const phone = tenant?.phone || tenant?.mobile || tenant?.phoneNumber;
    const due = new Date(rent.nextDue);
    const overdue = due < new Date();
    const message = `${overdue ? 'Overdue rent' : 'Rent reminder'}: ${rent.amount} ${rent.currency} for ${property?.title || 'your property'} ${overdue ? 'was due' : 'is due'} on ${due.toLocaleDateString()}.`;

    let sent = false;
    let error: string | undefined;

    try {
      if (phone && process.env.ENABLE_SMS !== 'false') {
        await NotificationService.sendSMS(phone, message);
        sent = true;
      } else if (phone && process.env.ENABLE_WHATSAPP !== 'false') {
        await NotificationService.sendWhatsApp(phone, message);
        sent = true;
      }
    } catch (err: any) {
      error = err.message;
      console.error('Failed to send external reminder:', err);
    }

    try {
      const Notification = (await import('@/models/Notification')).default;
      await Notification.create({
        user: tenant._id,
        type: 'rent_reminder',
        message,
        metadata: { rentId: rent._id, propertyId: property?._id, overdue }
      });
      sent = true;
    } catch (notifErr) {
      console.error('Failed to create in-app notification:', notifErr);
    }

    rent.lastReminderAt = new Date();
    rent.remindersSent = (rent.remindersSent || 0) + 1;
    await rent.save();

    return { rentId: rent._id.toString(), sent, error };
  }
}
