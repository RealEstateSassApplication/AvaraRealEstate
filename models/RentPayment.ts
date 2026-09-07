import mongoose, { Document, Schema } from 'mongoose';

export interface IRentPayment extends Document {
  rent: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  dueDate: Date;
  paidAt: Date;
  method: 'manual' | 'cash' | 'bank-transfer' | 'payhere' | 'other';
  providerReference?: string;
  status: 'paid' | 'refunded' | 'void';
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RentPaymentSchema = new Schema<IRentPayment>({
  rent: { type: Schema.Types.ObjectId, ref: 'Rent', required: true },
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR', uppercase: true },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date, required: true, default: Date.now },
  method: {
    type: String,
    enum: ['manual', 'cash', 'bank-transfer', 'payhere', 'other'],
    default: 'manual'
  },
  providerReference: { type: String, trim: true, maxlength: 200 },
  status: { type: String, enum: ['paid', 'refunded', 'void'], default: 'paid' },
  notes: { type: String, trim: true, maxlength: 2000 },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

RentPaymentSchema.index({ host: 1, paidAt: -1 });
RentPaymentSchema.index({ property: 1, paidAt: -1 });
RentPaymentSchema.index({ tenant: 1, paidAt: -1 });
RentPaymentSchema.index({ rent: 1, dueDate: 1, status: 1 });
RentPaymentSchema.index(
  { providerReference: 1 },
  { unique: true, sparse: true, partialFilterExpression: { providerReference: { $type: 'string' } } }
);

export default mongoose.models.RentPayment || mongoose.model<IRentPayment>('RentPayment', RentPaymentSchema);
