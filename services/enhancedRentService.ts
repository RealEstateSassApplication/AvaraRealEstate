import dbConnect from '@/lib/db';
import Rent from '@/models/Rent';
import Transaction from '@/models/Transaction';
import NotificationService from './notificationService';
import User from '@/models/User';
import Property from '@/models/Property';
import mongoose from 'mongoose';

type CreateRentInput = {
  propertyId: string;
  tenantId: string;
  amount: number;
  currency?: string;
  frequency?: 'monthly' | 'weekly' | 'yearly';
  firstDueDate: string | Date;
  notes?: string;
  securityDeposit?: number;
  leaseStartDate?: string | Date;
  leaseEndDate?: string | Date;
};

type RentPaymentInput = {
  rentId: string;
  amount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
};

export default class EnhancedRentService {
  // Create a comprehensive rent agreement
  static async createRent(payload: CreateRentInput) {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate property and tenant exist
      const [property, tenant] = await Promise.all([
        Property.findById(payload.propertyId),
        User.findById(payload.tenantId)
      ]);

      if (!property) throw new Error('Property not found');
      if (!tenant) throw new Error('Tenant not found');

      // Create rent agreement
      const rent = await Rent.create([{
        property: payload.propertyId,
        tenant: payload.tenantId,
        amount: payload.amount,
        currency: payload.currency || 'LKR',
        frequency: payload.frequency || 'monthly',
        nextDue: new Date(payload.firstDueDate),
        notes: payload.notes || '',
        securityDeposit: payload.securityDeposit,
        leaseStartDate: payload.leaseStartDate ? new Date(payload.leaseStartDate) : new Date(),
        leaseEndDate: payload.leaseEndDate ? new Date(payload.leaseEndDate) : undefined,
        status: 'active'
      }], { session });

      // Create initial transaction record for tracking
      await Transaction.create([{
        rent: rent[0]._id,
        from: payload.tenantId,
        to: property.owner,
        amount: payload.amount,
        currency: payload.currency || 'LKR',
        type: 'rent',
        status: 'pending',
        dueDate: new Date(payload.firstDueDate)
      }], { session });

      // Update property status to rented if not already
      await Property.findByIdAndUpdate(
        payload.propertyId,
        { status: 'rented' },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      
      return rent[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Record a rent payment and advance the next due date
  static async recordPayment(payload: RentPaymentInput) {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const rent = await Rent.findById(payload.rentId);
      if (!rent) throw new Error('Rent agreement not found');

      // Create payment transaction
      await Transaction.create([{
        rent: payload.rentId,
        from: rent.tenant,
        to: (await Property.findById(rent.property))?.owner,
        amount: payload.amount,
        currency: rent.currency,
        type: 'rent_payment',
        status: 'completed',
        paymentDate: payload.paymentDate || new Date(),
        paymentMethod: payload.paymentMethod,
        providerTransactionId: payload.transactionId,
        notes: payload.notes
      }], { session });

      // Advance the next due date
      const nextDue = new Date(rent.nextDue);
      if (rent.frequency === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (rent.frequency === 'weekly') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (rent.frequency === 'yearly') {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      // Update rent record
      const updatedRent = await Rent.findByIdAndUpdate(
        payload.rentId,
        {
          nextDue,
          lastPaidDate: payload.paymentDate || new Date(),
          lastPaidAmount: payload.amount,
          lastReminderAt: null,
          remindersSent: 0
        },
        { session, new: true }
      );

      await session.commitTransaction();
      session.endSession();
      
      return updatedRent;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Enhanced rent listing with payment history
  static async listRentsForUser(userId: string, includePaymentHistory = false) {
    await dbConnect();
    const rents = await Rent.find({ tenant: userId })
      .populate('property', 'title address images price')
      .lean();

    if (includePaymentHistory) {
      for (const rent of rents) {
        const payments = await Transaction.find({
          rent: rent._id,
          type: 'rent_payment',
          status: 'completed'
        }).sort({ paymentDate: -1 }).limit(10);
        (rent as any).recentPayments = payments;
      }
    }

    return rents;
  }

  static async listRentsForHost(hostId: string, includePaymentHistory = false) {
    await dbConnect();
    
    // First get properties owned by the host
    const properties = await Property.find({ owner: hostId }).select('_id').lean();
    const propertyIds = properties.map(p => p._id);

    const rents = await Rent.find({ property: { $in: propertyIds } })
      .populate('tenant', 'name email phone')
      .populate('property', 'title address images price')
      .lean();

    if (includePaymentHistory) {
      for (const rent of rents) {
        const payments = await Transaction.find({
          rent: rent._id,
          type: 'rent_payment',
          status: 'completed'
        }).sort({ paymentDate: -1 }).limit(10);
        (rent as any).recentPayments = payments;
        
        // Calculate payment statistics
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const avgPaymentAmount = payments.length > 0 ? totalPaid / payments.length : 0;
        (rent as any).paymentStats = {
          totalPaid,
          avgPaymentAmount,
          totalPayments: payments.length
        };
      }
    }

    return rents;
  }

  // Advanced reminder system
  static async triggerReminders({ daysBefore = 3, includeOverdue = true } = {}) {
    await dbConnect();
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysBefore);

    let query: any = { status: 'active' };
    
    if (includeOverdue) {
      query.nextDue = { $lte: threshold };
    } else {
      query.nextDue = { $gte: now, $lte: threshold };
    }

    const rents = await Rent.find(query)
      .populate('tenant', 'name email phone preferences')
      .populate('property', 'title address owner');

    const results: Array<{ rentId: string; sent: boolean; error?: string; reminderType: 'due_soon' | 'overdue' }> = [];

    for (const rent of rents) {
      try {
        const tenant = rent.tenant as any;
        const property = rent.property as any;
        const dueDate = new Date(rent.nextDue);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isOverdue = diffDays < 0;
        const reminderType = isOverdue ? 'overdue' : 'due_soon';
        
        let message: string;
        if (isOverdue) {
          message = `OVERDUE RENT: Your rent of ${rent.amount} ${rent.currency} for ${property.title} was due ${Math.abs(diffDays)} days ago. Please pay immediately to avoid late fees.`;
        } else {
          message = `Rent Reminder: Your rent of ${rent.amount} ${rent.currency} for ${property.title} is due on ${dueDate.toLocaleDateString()}. Please ensure payment is made on time.`;
        }

        const phone = tenant.phone || tenant.mobile || tenant.phoneNumber;
        
        // Send notifications based on tenant preferences
        if (tenant.preferences?.notifications?.email && tenant.email) {
          // Send email notification (implement email service)
          console.log(`Email notification sent to ${tenant.email}`);
        }
        
        if (tenant.preferences?.notifications?.sms && phone) {
          await NotificationService.sendSMS(phone, message);
        }
        
        if (tenant.preferences?.notifications?.whatsapp && phone) {
          await NotificationService.sendWhatsApp(phone, message);
        }

        // Update rent record
        rent.lastReminderAt = new Date();
        rent.remindersSent = (rent.remindersSent || 0) + 1;
        await rent.save();
        
        results.push({ rentId: rent._id.toString(), sent: true, reminderType });
      } catch (err: any) {
        results.push({ 
          rentId: rent._id.toString(), 
          sent: false, 
          error: err.message,
          reminderType: 'due_soon'
        });
      }
    }

    return results;
  }

  // Get comprehensive rent statistics
  static async getRentStatistics(hostId?: string, tenantId?: string) {
    await dbConnect();
    
    let matchFilter: any = {};
    
    if (hostId) {
      const properties = await Property.find({ owner: hostId }).select('_id');
      matchFilter.property = { $in: properties.map(p => p._id) };
    }
    
    if (tenantId) {
      matchFilter.tenant = tenantId;
    }

    const stats = await Rent.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalRents: { $sum: 1 },
          activeRents: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalMonthlyIncome: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$frequency', 'monthly'] }, { $eq: ['$status', 'active'] }] }, 
                '$amount', 
                0
              ] 
            } 
          },
          avgRentAmount: { $avg: '$amount' },
          overdueRents: {
            $sum: {
              $cond: [
                { $lt: ['$nextDue', new Date()] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get payment statistics
    const paymentStats = await Transaction.aggregate([
      { 
        $match: { 
          type: 'rent_payment', 
          status: 'completed',
          ...(hostId && { to: hostId }),
          ...(tenantId && { from: tenantId })
        } 
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmountCollected: { $sum: '$amount' },
          avgPaymentAmount: { $avg: '$amount' }
        }
      }
    ]);

    return {
      ...(stats[0] || {
        totalRents: 0,
        activeRents: 0,
        totalMonthlyIncome: 0,
        avgRentAmount: 0,
        overdueRents: 0
      }),
      ...(paymentStats[0] || {
        totalPayments: 0,
        totalAmountCollected: 0,
        avgPaymentAmount: 0
      })
    };
  }

  // Bulk operations for admins
  static async bulkSendReminders(propertyIds?: string[]) {
    await dbConnect();
    
    let query: any = { status: 'active' };
    
    if (propertyIds && propertyIds.length > 0) {
      query.property = { $in: propertyIds };
    }

    const rents = await Rent.find(query);
    const results = await this.triggerReminders({ daysBefore: 7, includeOverdue: true });
    
    return {
      processedCount: rents.length,
      successCount: results.filter(r => r.sent).length,
      failureCount: results.filter(r => !r.sent).length,
      results
    };
  }

  // Legacy method for backward compatibility
  static async markAsPaid(rentId: string) {
    const rent = await Rent.findById(rentId);
    if (!rent) throw new Error('Rent not found');
    
    return this.recordPayment({
      rentId,
      amount: rent.amount,
      paymentDate: new Date(),
      notes: 'Marked as paid via admin interface'
    });
  }
}