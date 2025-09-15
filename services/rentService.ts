import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import NotificationService from './notificationService';
import User from '@/models/User';
import Property from '@/models/Property';

type CreateRentInput = {
  propertyId: string;
  tenantId: string;
  amount: number;
  currency?: string;
  frequency?: 'monthly' | 'weekly' | 'yearly';
  firstDueDate: string | Date;
  notes?: string;
};

export default class RentService {
  static async createRent(payload: CreateRentInput) {
    await dbConnect();
    const rent = await Rent.create({
      property: payload.propertyId,
      tenant: payload.tenantId,
      amount: payload.amount,
      currency: payload.currency || 'LKR',
      frequency: payload.frequency || 'monthly',
      nextDue: new Date(payload.firstDueDate),
      notes: payload.notes || ''
    });
    return rent;
  }

  static async listRentsForUser(userId: string) {
    await dbConnect();
    return Rent.find({ tenant: userId }).populate('property').lean();
  }

  static async listRentsForHost(hostId: string) {
    await dbConnect();
    // find rents for properties owned by host
    const properties = await Property.find({ owner: hostId }).select('_id').lean();
    const ids = properties.map(p => p._id);
    return Rent.find({ property: { $in: ids } }).populate('tenant property').lean();
  }

  static async markAsPaid(rentId: string) {
    await dbConnect();
    const rent = await Rent.findById(rentId);
    if (!rent) throw new Error('Rent not found');
    // advance nextDue based on frequency
    const cur = new Date(rent.nextDue);
    if (rent.frequency === 'monthly') cur.setMonth(cur.getMonth() + 1);
    else if (rent.frequency === 'weekly') cur.setDate(cur.getDate() + 7);
    else if (rent.frequency === 'yearly') cur.setFullYear(cur.getFullYear() + 1);
    rent.nextDue = cur;
    rent.lastReminderAt = undefined as any;
    rent.remindersSent = 0;
    await rent.save();
    return rent;
  }

  static async triggerReminders({ daysBefore = 3 } = {}) {
    await dbConnect();
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysBefore);

    // find active rents with nextDue within threshold
    const rents = await Rent.find({ status: 'active', nextDue: { $lte: threshold } }).populate('tenant property');

    const results: Array<{ rentId: string; sent: boolean; error?: string }> = [];

    for (const rent of rents) {
      try {
        const tenant = (rent.tenant as any) || await User.findById((rent.tenant as any)).lean();
        const property = (rent.property as any) || await Property.findById((rent.property as any)).lean();
        const phone = tenant?.phone || tenant?.mobile || tenant?.phoneNumber;
        const message = `Reminder: Rent of ${rent.amount} ${rent.currency} for property ${property?.title || property?.address?.city || 'your property'} is due on ${new Date(rent.nextDue).toLocaleDateString()}. Please pay on time.`;

        // prefer SMS; fallback to WhatsApp
        if (phone && process.env.ENABLE_SMS !== 'false') {
          await NotificationService.sendSMS(phone, message);
        } else if (phone && process.env.ENABLE_WHATSAPP !== 'false') {
          await NotificationService.sendWhatsApp(phone, message);
        } else {
          // no phone; skip but record that we attempted
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
}
