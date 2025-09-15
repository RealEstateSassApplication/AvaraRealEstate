import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role?: 'user' | 'tenant' | 'host' | 'admin' | 'super-admin';
  // preferred multi-role array
  roles?: string[];
  profilePhoto?: string;
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  listings: mongoose.Types.ObjectId[];
  favorites: mongoose.Types.ObjectId[];
  address?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
    currency: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: {
    type: String,
    enum: ['user', 'tenant', 'host', 'admin', 'super-admin'],
    default: 'user'
  },
  roles: {
    type: [String],
    enum: ['guest', 'user', 'tenant', 'host', 'admin', 'super-admin'],
    default: ['user']
  },
  profilePhoto: { type: String },
  verified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  listings: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  address: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true }
    },
    currency: { type: String, default: 'LKR' },
    language: { type: String, default: 'en' }
  },
  lastLoginAt: Date
}, {
  timestamps: true
});

// email and phone are declared with `unique: true` in the schema above.
// Avoid duplicate index creation by not re-declaring indexes here.
// UserSchema.index({ email: 1 });
// UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });


const MODEL_NAME = 'User';
if (mongoose.models && (mongoose.models as any)[MODEL_NAME]) {
  delete (mongoose.models as any)[MODEL_NAME];
}
export default mongoose.models.User || mongoose.model<IUser>(MODEL_NAME, UserSchema);