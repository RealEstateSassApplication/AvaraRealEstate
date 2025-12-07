import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  property: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  startDate: Date;
  durationMonths: number;
  monthlyRent: number;
  totalRent: number;
  numberOfOccupants?: number;
  employmentStatus?: string;
  monthlyIncome?: number;
  hasPets?: boolean;
  petDetails?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'more_info';
  submittedAt: Date;
  reviewedAt?: Date;
  additionalNotes?: string;
  rentAgreement?: mongoose.Types.ObjectId;
}

const ApplicationSchema = new Schema<IApplication>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true },
  monthlyRent: { type: Number, required: true },
  totalRent: { type: Number, required: true },
  numberOfOccupants: { type: Number },
  employmentStatus: { type: String },
  monthlyIncome: { type: Number },
  hasPets: { type: Boolean, default: false },
  petDetails: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'more_info'], default: 'pending' },
  submittedAt: { type: Date, default: () => new Date() },
  reviewedAt: { type: Date },
  additionalNotes: { type: String },
  rentAgreement: { type: Schema.Types.ObjectId, ref: 'Rent' }
}, {
  timestamps: true
});

// Avoid model overwrite in dev with HMR
const MODEL_NAME = 'Application';
if (mongoose.models && (mongoose.models as any)[MODEL_NAME]) {
  delete (mongoose.models as any)[MODEL_NAME];
}

export default mongoose.models.Application || mongoose.model<IApplication>(MODEL_NAME, ApplicationSchema);
