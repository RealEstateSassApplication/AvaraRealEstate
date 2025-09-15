import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  property: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  nights: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  guestCount: number;
  guestDetails: {
    adults: number;
    children: number;
  };
  specialRequests?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nights: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  guestCount: { type: Number, required: true, min: 1 },
  guestDetails: {
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 }
  },
  specialRequests: String,
  checkInTime: String,
  checkOutTime: String,
  cancellationReason: String
}, {
  timestamps: true
});

BookingSchema.index({ property: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ host: 1, createdAt: -1 });
BookingSchema.index({ status: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);