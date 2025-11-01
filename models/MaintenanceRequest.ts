import mongoose, { Document, Schema } from 'mongoose';

export interface IMaintenanceRequest extends Document {
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  host: mongoose.Types.ObjectId;
  rent: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'heating' | 'cooling' | 'appliances' | 'structural' | 'pest-control' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed' | 'cancelled';
  images: string[];
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  notes?: string;
  tenantNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRequestSchema = new Schema<IMaintenanceRequest>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rent: { type: Schema.Types.ObjectId, ref: 'Rent' },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'heating', 'cooling', 'appliances', 'structural', 'pest-control', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  images: [{ type: String }],
  estimatedCost: { type: Number, min: 0 },
  actualCost: { type: Number, min: 0 },
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  assignedTo: { type: String },
  notes: { type: String },
  tenantNotes: { type: String }
}, {
  timestamps: true
});

MaintenanceRequestSchema.index({ property: 1, createdAt: -1 });
MaintenanceRequestSchema.index({ tenant: 1, createdAt: -1 });
MaintenanceRequestSchema.index({ host: 1, createdAt: -1 });
MaintenanceRequestSchema.index({ status: 1 });

const MODEL_NAME = 'MaintenanceRequest';
if (mongoose.models && (mongoose.models as any)[MODEL_NAME]) {
  delete (mongoose.models as any)[MODEL_NAME];
}

export default mongoose.models.MaintenanceRequest || mongoose.model<IMaintenanceRequest>(MODEL_NAME, MaintenanceRequestSchema);
