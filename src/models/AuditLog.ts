import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'blog.created'
  | 'blog.updated'
  | 'blog.deleted'
  | 'user.role_changed'
  | 'blog.submitted_for_review'
  | 'blog.approved'
  | 'blog.changes_requested'
  | 'blog.published'
  | 'blog.comment_added';

export interface IAuditLog extends Document {
  orgId: mongoose.Types.ObjectId;
  actorId: string;
  actorRole: string;
  action: AuditAction;
  targetType: 'Blog' | 'User';
  targetId: string;
  before: unknown;
  after: unknown;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  actorId: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  before: { type: Schema.Types.Mixed, default: null },
  after: { type: Schema.Types.Mixed, default: null },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// The audit view is almost always "this org, newest first".
auditLogSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
