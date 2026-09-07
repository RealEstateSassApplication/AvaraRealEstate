import mongoose from 'mongoose';

const RentSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR', uppercase: true },
  frequency: { type: String, enum: ['monthly', 'weekly', 'yearly'], default: 'monthly' },
  nextDue: { type: Date, required: true },
  leaseStartDate: { type: Date },
  leaseEndDate: { type: Date },
  securityDeposit: { type: Number, min: 0, default: 0 },
  depositStatus: {
    type: String,
    enum: ['not-required', 'pending', 'held', 'partially-refunded', 'refunded', 'forfeited'],
    default: 'not-required'
  },
  gracePeriodDays: { type: Number, min: 0, max: 60, default: 0 },
  lastPaidAt: { type: Date },
  totalPaid: { type: Number, min: 0, default: 0 },
  paymentsCount: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['active', 'paused', 'cancelled', 'ended'], default: 'active' },
  lastReminderAt: { type: Date },
  remindersSent: { type: Number, default: 0, min: 0 },
  notes: { type: String, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

RentSchema.index({ property: 1, status: 1 });
RentSchema.index({ tenant: 1, status: 1 });
RentSchema.index({ nextDue: 1, status: 1 });
RentSchema.index({ leaseEndDate: 1, status: 1 });

export default mongoose.models.Rent || mongoose.model('Rent', RentSchema);
