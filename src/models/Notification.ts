import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'review_assigned',
  'report_approved',
  'changes_requested',
  'report_published',
  'role_changed',
] as const;

export type NotificationType =
  | 'review_assigned'
  | 'report_approved'
  | 'changes_requested'
  | 'report_published'
  | 'role_changed';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // recipient
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  message: { type: String, required: true },
  link: { type: String, required: true }, // frontend route, e.g. /report/<id>
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, createdAt: -1 });

NotificationSchema.virtual('id').get(function () {
  return this._id?.toString();
});

NotificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const plain = ret as Record<string, unknown>;
    delete plain._id;
    return plain;
  },
});

NotificationSchema.set('toObject', {
  virtuals: true,
  transform: (_doc, ret) => {
    const plain = ret as Record<string, unknown>;
    delete plain._id;
    return plain;
  },
});

export default mongoose.model('Notification', NotificationSchema);
