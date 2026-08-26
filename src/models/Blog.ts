import mongoose from 'mongoose';

export const BLOG_STATUS = ['draft', 'under_review', 'approved', 'published'] as const;

const BlogSchema = new mongoose.Schema({
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
  status: { type: String, enum: BLOG_STATUS, default: 'draft' },
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

BlogSchema.index({ orgId: 1, status: 1 });

BlogSchema.virtual('id').get(function () {
  return this._id?.toString();
});
BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });

export default mongoose.model('Blog', BlogSchema);
