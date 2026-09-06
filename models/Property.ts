import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  type: 'apartment' | 'house' | 'villa' | 'bungalow' | 'land' | 'commercial' | 'room';
  purpose: 'rent' | 'sale' | 'booking';
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'sold' | 'rented';
  price: number;
  currency: string;
  rentFrequency?: 'monthly' | 'weekly' | 'daily';
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  landSize?: number;
  images: string[];
  address: {
    street: string;
    city: string;
    district: string;
    postalCode?: string;
    country: string;
  };
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  amenities: string[];
  features: string[];
  utilities: {
    electricity: boolean;
    water: boolean;
    gas: boolean;
    internet: boolean;
    parking: boolean;
  };
  availability: {
    immediate: boolean;
    availableFrom?: Date;
    minimumStay?: number;
    maximumStay?: number;
  };
  calendar: {
    blockedDates: Date[];
    bookedDates: Date[];
  };
  pricing: {
    weeklyDiscount?: number;
    monthlyDiscount?: number;
    cleaningFee?: number;
    securityDeposit?: number;
  };
  policies: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    partiesAllowed: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  };
  ratings: {
    average: number;
    count: number;
  };
  views: number;
  featured: boolean;
  verified: boolean;
  verification: {
    identityVerified: boolean;
    ownershipVerified: boolean;
    addressVerified: boolean;
    inspectionVerified: boolean;
    pricingReviewed: boolean;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    notes?: string;
  };
  trustScore: number;
  trustLevel: 'unverified' | 'reviewed' | 'verified' | 'premier';
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'bungalow', 'land', 'commercial', 'room'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['rent', 'sale', 'booking'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'rejected', 'sold', 'rented'],
    default: 'pending'
  },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  rentFrequency: {
    type: String,
    enum: ['monthly', 'weekly', 'daily'],
    required: function() { return this.purpose === 'rent' || this.purpose === 'booking'; }
  },
  bedrooms: { type: Number, min: 0 },
  bathrooms: { type: Number, min: 0 },
  areaSqft: { type: Number, min: 0 },
  landSize: { type: Number, min: 0 },
  images: [{ type: String, required: true }],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false,
    },
    coordinates: {
      type: [Number],
      validate: {
        validator(value: number[]) {
          return !value?.length || (
            value.length === 2 &&
            value[0] >= -180 && value[0] <= 180 &&
            value[1] >= -90 && value[1] <= 90
          );
        },
        message: 'Invalid coordinates',
      },
    },
  },
  amenities: [String],
  features: [String],
  utilities: {
    electricity: { type: Boolean, default: true },
    water: { type: Boolean, default: true },
    gas: { type: Boolean, default: false },
    internet: { type: Boolean, default: false },
    parking: { type: Boolean, default: false }
  },
  availability: {
    immediate: { type: Boolean, default: true },
    availableFrom: Date,
    minimumStay: { type: Number, default: 1 },
    maximumStay: Number
  },
  calendar: {
    blockedDates: [Date],
    bookedDates: [Date]
  },
  pricing: {
    weeklyDiscount: { type: Number, min: 0, max: 50 },
    monthlyDiscount: { type: Number, min: 0, max: 50 },
    cleaningFee: { type: Number, min: 0 },
    securityDeposit: { type: Number, min: 0 }
  },
  policies: {
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    partiesAllowed: { type: Boolean, default: false },
    checkInTime: String,
    checkOutTime: String
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  verification: {
    identityVerified: { type: Boolean, default: false },
    ownershipVerified: { type: Boolean, default: false },
    addressVerified: { type: Boolean, default: false },
    inspectionVerified: { type: Boolean, default: false },
    pricingReviewed: { type: Boolean, default: false },
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, maxlength: 2000 },
  },
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  trustLevel: {
    type: String,
    enum: ['unverified', 'reviewed', 'verified', 'premier'],
    default: 'unverified',
  },
}, {
  timestamps: true
});

PropertySchema.index({ purpose: 1, status: 1 });
PropertySchema.index({ title: 'text', description: 'text' });
PropertySchema.index({ price: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ owner: 1 });
PropertySchema.index({ featured: 1, createdAt: -1 });
PropertySchema.index({ trustScore: -1, createdAt: -1 });
PropertySchema.index({ location: '2dsphere' }, { sparse: true });

if (mongoose.models.Property) {
  delete mongoose.models.Property;
}
export default mongoose.model<IProperty>('Property', PropertySchema);
