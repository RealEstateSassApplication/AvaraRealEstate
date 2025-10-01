import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  message: string;
  metadata?: any;
  read: boolean;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false }
}, { timestamps: true });

const MODEL_NAME = 'Notification';
if (mongoose.models && (mongoose.models as any)[MODEL_NAME]) {
  delete (mongoose.models as any)[MODEL_NAME];
}

export default mongoose.models.Notification || mongoose.model<INotification>(MODEL_NAME, NotificationSchema);
