import mongoose, { Document, Schema } from 'mongoose';

export interface IRentalRequest extends Document {
  user: mongoose.Types.ObjectId;
  propertyTypes: string[];
  purpose: 'rent' | 'booking';
  location: {
    cities: string[];
    districts: string[];
    flexible: boolean;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
    frequency: 'monthly' | 'weekly' | 'daily';
  };
  requirements: {
    bedrooms: {
      min?: number;
      max?: number;
    };
    bathrooms: {
      min?: number;
      max?: number;
    };
    areaSqft: {
      min?: number;
      max?: number;
    };
  };
  amenities: string[];
  moveInDate?: Date;
  durationMonths?: number;
  occupants?: number;
  hasPets: boolean;
  petDetails?: string;
  additionalNotes?: string;
  status: 'active' | 'matched' | 'fulfilled' | 'cancelled';
  matchedProperties: mongoose.Types.ObjectId[];
  contactPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RentalRequestSchema = new Schema<IRentalRequest>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  propertyTypes: {
    type: [String],
    enum: ['apartment', 'house', 'villa', 'bungalow', 'room', 'commercial'],
    default: []
  },
  purpose: {
    type: String,
    enum: ['rent', 'booking'],
    required: true
  },
  location: {
    cities: { type: [String], default: [] },
    districts: { type: [String], default: [] },
    flexible: { type: Boolean, default: false }
  },
  budget: {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    frequency: {
      type: String,
      enum: ['monthly', 'weekly', 'daily'],
      required: true
    }
  },
  requirements: {
    bedrooms: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    bathrooms: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    areaSqft: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    }
  },
  amenities: { type: [String], default: [] },
  moveInDate: { type: Date },
  durationMonths: { type: Number, min: 1 },
  occupants: { type: Number, min: 1 },
  hasPets: { type: Boolean, default: false },
  petDetails: { type: String },
  additionalNotes: { type: String },
  status: {
    type: String,
    enum: ['active', 'matched', 'fulfilled', 'cancelled'],
    default: 'active'
  },
  matchedProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  contactPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
RentalRequestSchema.index({ user: 1, status: 1 });
RentalRequestSchema.index({ status: 1, createdAt: -1 });
RentalRequestSchema.index({ 'location.cities': 1 });
RentalRequestSchema.index({ 'location.districts': 1 });
RentalRequestSchema.index({ propertyTypes: 1 });
RentalRequestSchema.index({ purpose: 1 });
RentalRequestSchema.index({ 'budget.min': 1, 'budget.max': 1 });

// Avoid model overwrite in dev with HMR
const MODEL_NAME = 'RentalRequest';
if (mongoose.models && (mongoose.models as any)[MODEL_NAME]) {
  delete (mongoose.models as any)[MODEL_NAME];
}

export default mongoose.models.RentalRequest || mongoose.model<IRentalRequest>(MODEL_NAME, RentalRequestSchema);
