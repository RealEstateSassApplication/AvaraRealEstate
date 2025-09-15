import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  booking?: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  type: 'booking' | 'refund' | 'payout' | 'fee';
  provider: 'payhere' | 'stripe' | 'manual';
  providerTransactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  property: { type: Schema.Types.ObjectId, ref: 'Property' },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  type: {
    type: String,
    enum: ['booking', 'refund', 'payout', 'fee'],
    required: true
  },
  provider: {
    type: String,
    enum: ['payhere', 'stripe', 'manual'],
    required: true
  },
  providerTransactionId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: String,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

TransactionSchema.index({ from: 1, createdAt: -1 });
TransactionSchema.index({ to: 1, createdAt: -1 });
TransactionSchema.index({ booking: 1 });
TransactionSchema.index({ status: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);