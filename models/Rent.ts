import mongoose from 'mongoose';

const RentSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  frequency: { type: String, enum: ['monthly','weekly','yearly'], default: 'monthly' },
  // nextDue stores the upcoming due date for the rent
  nextDue: { type: Date, required: true },
  status: { type: String, enum: ['active','paused','cancelled'], default: 'active' },
  lastReminderAt: { type: Date },
  remindersSent: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Rent || mongoose.model('Rent', RentSchema);
