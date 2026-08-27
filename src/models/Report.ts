import mongoose from 'mongoose';

export const REPORT_STATUS = ['draft', 'under_review', 'approved', 'published'] as const;

const ReportSchema = new mongoose.Schema({
  title: String,
  hashtags: { type: [String] },
  coverImage: String,
  content: String,
  authorId: String,
  authorName: String,
  authorAvatar: String,
  createdAt: String,
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
        createdAT: { type: Date, default: Date.now },
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
ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });

export default mongoose.model('Report', ReportSchema);
