import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title: String,
  hashtags: { type: [String] },
  coverImage: String,
  content: String,
  authorId: String,
  authorName: String,
  authorAvatar: String,
  createdAt: String,
  isDraft: Boolean
});

BlogSchema.virtual('id').get(function () {
  return this._id?.toString();
});
BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });

export default mongoose.model('Blog', BlogSchema);
