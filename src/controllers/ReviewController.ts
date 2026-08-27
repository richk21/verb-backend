import { Request, Response } from 'express';
import Report from '../models/Report';
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

    const report = await Report.findById(id);
    if (!report || report.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Only the author can submit this for review' });
    }
    if (report.status !== 'draft') {
      return res
        .status(400)
        .json({ message: `Cannot submit for review from status "${report.status}"` });
    }

    report.status = 'under_review';
    await report.save();

    await logAction({
      req,
      action: 'report.submitted_for_review',
      targetType: 'Report',
      targetId: report.id,
      before: { status: 'draft' },
      after: { status: 'under_review' },
    });

    res.json(report);
  } catch (err) {
    console.error('Error submitting report for review:', err);
    res.status(500).json({ error: 'Failed to submit for review' });
  }
};

/**
 * Reviewer/admin approves a submission.
 * under_review -> approved
 * (Route-level requireRole("reviewer", "admin") enforces WHO can call this;
 * this function only enforces the state transition itself.)
 */
export const approveReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const report = await Report.findById(id);
    if (!report || report.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.status !== 'under_review') {
      return res.status(400).json({ message: `Cannot approve from status "${report.status}"` });
    }

    report.status = 'approved';
    report.reviewerId = req.user!.id;
    await report.save();

    await logAction({
      req,
      action: 'report.approved',
      targetType: 'Report',
      targetId: report.id,
      before: { status: 'under_review' },
      after: { status: 'approved', reviewerId: req.user!.id },
    });

    res.json(report);
  } catch (err) {
    console.error('Error approving report:', err);
    res.status(500).json({ error: 'Failed to approve report' });
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

    const report = await Report.findById(id);
    if (!report || report.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.status !== 'under_review') {
      return res
        .status(400)
        .json({ message: `Cannot request changes from status "${report.status}"` });
    }

    report.reviewerComments.push({
      id: `${Date.now()}`,
      authorId: req.user!.id,
      authorName: req.user!.name,
      text: comment.trim(),
      createdAt: new Date(),
    });
    report.status = 'draft';
    report.reviewerId = req.user!.id;
    await report.save();

    await logAction({
      req,
      action: 'report.changes_requested',
      targetType: 'Report',
      targetId: report.id,
      before: { status: 'under_review' },
      after: { status: 'draft', comment: comment.trim() },
    });

    res.json(report);
  } catch (err) {
    console.error('Error requesting changes:', err);
    res.status(500).json({ error: 'Failed to request changes' });
  }
};

/**
 * Reviewer/admin gives final publish sign-off. approved -> published
 */
export const publishReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const report = await Report.findById(id);
    if (!report || report.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.status !== 'approved') {
      return res.status(400).json({ message: `Cannot publish from status "${report.status}"` });
    }

    report.status = 'published';
    await report.save();

    await logAction({
      req,
      action: 'report.published',
      targetType: 'Report',
      targetId: report.id,
      before: { status: 'approved' },
      after: { status: 'published' },
    });

    res.json(report);
  } catch (err) {
    console.error('Error publishing report:', err);
    res.status(500).json({ error: 'Failed to publish report' });
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

    const report = await Report.findById(id);
    if (!report || report.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.reviewerComments.push({
      id: `${Date.now()}`,
      authorId: req.user!.id,
      authorName: req.user!.name,
      text: comment.trim(),
      createdAt: new Date(),
    });
    await report.save();

    await logAction({
      req,
      action: 'report.comment_added',
      targetType: 'Report',
      targetId: report.id,
      before: null,
      after: { comment: comment.trim() },
    });

    res.json(report);
  } catch (err) {
    console.error('Error adding review comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
