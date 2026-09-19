import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'review_assigned',
  'report_approved',
  'changes_requested',
  'report_published',
] as const;

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

export default mongoose.model('Notification', NotificationSchema);
