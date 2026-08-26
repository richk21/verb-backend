import { Request, Response } from 'express';
import Blog from '../models/Blog';
import { logAction } from '../utils/auditLogger';

/**
 * Author submits their own draft for review.
 * draft -> under_review
 */
export const submitForReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const blog = await Blog.findById(id);
    if (!blog || blog.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (blog.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Only the author can submit this for review' });
    }
    if (blog.status !== 'draft') {
      return res
        .status(400)
        .json({ message: `Cannot submit for review from status "${blog.status}"` });
    }

    blog.status = 'under_review';
    await blog.save();

    await logAction({
      req,
      action: 'blog.submitted_for_review',
      targetType: 'Blog',
      targetId: blog.id,
      before: { status: 'draft' },
      after: { status: 'under_review' },
    });

    res.json(blog);
  } catch (err) {
    console.error('Error submitting blog for review:', err);
    res.status(500).json({ error: 'Failed to submit for review' });
  }
};

/**
 * Reviewer/admin approves a submission.
 * under_review -> approved
 * (Route-level requireRole("reviewer", "admin") enforces WHO can call this;
 * this function only enforces the state transition itself.)
 */
export const approveBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const blog = await Blog.findById(id);
    if (!blog || blog.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (blog.status !== 'under_review') {
      return res.status(400).json({ message: `Cannot approve from status "${blog.status}"` });
    }

    blog.status = 'approved';
    blog.reviewerId = req.user!.id;
    await blog.save();

    await logAction({
      req,
      action: 'blog.approved',
      targetType: 'Blog',
      targetId: blog.id,
      before: { status: 'under_review' },
      after: { status: 'approved', reviewerId: req.user!.id },
    });

    res.json(blog);
  } catch (err) {
    console.error('Error approving blog:', err);
    res.status(500).json({ error: 'Failed to approve blog' });
  }
};

/**
 * Reviewer/admin sends a submission back for changes, with a required
 * comment explaining why. under_review -> draft
 */
export const requestChanges = async (req: Request, res: Response) => {
  try {
    const { id, comment } = req.body;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'A comment is required when requesting changes' });
    }

    const blog = await Blog.findById(id);
    if (!blog || blog.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (blog.status !== 'under_review') {
      return res
        .status(400)
        .json({ message: `Cannot request changes from status "${blog.status}"` });
    }

    blog.reviewerComments.push({
      id: `${Date.now()}`,
      authorId: req.user!.id,
      authorName: req.user!.name,
      text: comment.trim(),
      createdAt: new Date(),
    });
    blog.status = 'draft';
    blog.reviewerId = req.user!.id;
    await blog.save();

    await logAction({
      req,
      action: 'blog.changes_requested',
      targetType: 'Blog',
      targetId: blog.id,
      before: { status: 'under_review' },
      after: { status: 'draft', comment: comment.trim() },
    });

    res.json(blog);
  } catch (err) {
    console.error('Error requesting changes:', err);
    res.status(500).json({ error: 'Failed to request changes' });
  }
};

/**
 * Reviewer/admin gives final publish sign-off. approved -> published
 */
export const publishBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const blog = await Blog.findById(id);
    if (!blog || blog.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (blog.status !== 'approved') {
      return res.status(400).json({ message: `Cannot publish from status "${blog.status}"` });
    }

    blog.status = 'published';
    await blog.save();

    await logAction({
      req,
      action: 'blog.published',
      targetType: 'Blog',
      targetId: blog.id,
      before: { status: 'approved' },
      after: { status: 'published' },
    });

    res.json(blog);
  } catch (err) {
    console.error('Error publishing blog:', err);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
};

/**
 * Reviewer/admin leaves an inline comment WITHOUT changing status —
 * separate from requestChanges, for feedback that doesn't need a full
 * send-back-to-draft cycle.
 */
export const addReviewComment = async (req: Request, res: Response) => {
  try {
    const { id, comment } = req.body;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const blog = await Blog.findById(id);
    if (!blog || blog.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.reviewerComments.push({
      id: `${Date.now()}`,
      authorId: req.user!.id,
      authorName: req.user!.name,
      text: comment.trim(),
      createdAt: new Date(),
    });
    await blog.save();

    await logAction({
      req,
      action: 'blog.comment_added',
      targetType: 'Blog',
      targetId: blog.id,
      before: null,
      after: { comment: comment.trim() },
    });

    res.json(blog);
  } catch (err) {
    console.error('Error adding review comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
