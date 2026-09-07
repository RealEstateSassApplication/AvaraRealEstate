import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyExpense extends Document {
  property: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  category: 'maintenance' | 'repairs' | 'utilities' | 'tax' | 'insurance' | 'management' | 'capital' | 'legal' | 'other';
  amount: number;
  currency: string;
  incurredAt: Date;
  description: string;
  vendor?: string;
  receiptUrl?: string;
  recurring: boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly';
  status: 'recorded' | 'void';
  createdAt: Date;
  updatedAt: Date;
}

const PropertyExpenseSchema = new Schema<IPropertyExpense>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['maintenance', 'repairs', 'utilities', 'tax', 'insurance', 'management', 'capital', 'legal', 'other'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR', uppercase: true },
  incurredAt: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  vendor: { type: String, trim: true, maxlength: 200 },
  receiptUrl: { type: String, trim: true, maxlength: 1000 },
  recurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
  status: { type: String, enum: ['recorded', 'void'], default: 'recorded' }
}, { timestamps: true });

PropertyExpenseSchema.index({ owner: 1, incurredAt: -1 });
PropertyExpenseSchema.index({ property: 1, incurredAt: -1 });
PropertyExpenseSchema.index({ owner: 1, category: 1, incurredAt: -1 });

export default mongoose.models.PropertyExpense || mongoose.model<IPropertyExpense>('PropertyExpense', PropertyExpenseSchema);
