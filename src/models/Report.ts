import mongoose from 'mongoose';

export const REPORT_STATUS = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
} as const;

const ReportSchema = new mongoose.Schema({
  title: String,
  hashtags: { type: [String] },
  coverImage: String,
  content: String,
  authorId: String,
  authorName: String,
  authorAvatar: String,
  createdAt: String,
  reviewerName: { type: String, default: null },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  status: { type: String, enum: REPORT_STATUS, default: 'draft' },
  reviewerId: { type: String, default: null },
  reviewerComments: {
    type: [
      {
        id: { type: String, required: true },
        authorId: { type: String, required: true },
        authorName: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        replies: {
          type: [
            {
              id: { type: String, required: true },
              authorId: { type: String, required: true },
              authorName: { type: String, required: true },
              text: { type: String, required: true },
              createdAt: { type: Date, default: Date.now },
            },
          ],
          default: [],
        },
      },
    ],
    default: [],
  },
  timeline: {
    type: [
      {
        time: { type: String, required: true },
        event: { type: String, required: true },
        severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
      },
    ],
    default: [],
  },
});

ReportSchema.index({ orgId: 1, status: 1 });

ReportSchema.virtual('id').get(function () {
  return this._id?.toString();
});
ReportSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const plain = ret as Record<string, unknown>;
    delete plain._id;
    return plain;
  },
});
ReportSchema.set('toObject', {
  virtuals: true,
  transform: (_doc, ret) => {
    const plain = ret as Record<string, unknown>;
    delete plain._id;
    return plain;
  },
});

export default mongoose.model('Report', ReportSchema);
