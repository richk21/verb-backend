"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyToComment = exports.addReviewComment = exports.publishReport = exports.requestChanges = exports.approveReport = exports.submitForReview = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const User_1 = __importDefault(require("../models/User"));
const auditLogger_1 = require("../utils/auditLogger");
const notifications_1 = require("../utils/notifications");
/**
 * Author submits their own draft for review.
 * draft -> under_review
 */
const submitForReview = async (req, res) => {
    try {
        const { id, reviewerId } = req.body;
        const userId = req.user?.id;
        const orgId = req.user?.orgId;
        if (!userId || !orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!reviewerId) {
            return res.status(400).json({ message: 'A reviewer must be selected.' });
        }
        if (reviewerId === userId) {
            return res.status(400).json({ message: 'You cannot select yourself as a reviewer.' });
        }
        const report = await Report_1.default.findById(id);
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
        const reviewer = await User_1.default.findOne({
            _id: reviewerId,
            orgId,
            role: { $in: ['reviewer', 'admin'] },
        });
        if (!reviewer) {
            return res
                .status(400)
                .json({ message: 'Selected reviewer is not valid for this organization.' });
        }
        report.status = 'under_review';
        report.reviewerId = reviewerId;
        await report.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.submitted_for_review',
            targetType: 'Report',
            targetId: report.id,
            before: { status: 'draft' },
            after: { status: 'under_review', reviewerId },
        });
        await (0, notifications_1.createNotification)({
            userId: reviewerId,
            orgId,
            type: 'review_assigned',
            message: `${req.user.name} submitted "${report.title}" for your review.`,
            link: `/report/${report.id}`,
        });
        res.json(report);
    }
    catch (err) {
        console.error('Error submitting report for review:', err);
        res.status(500).json({ error: 'Failed to submit for review' });
    }
};
exports.submitForReview = submitForReview;
/**
 * Reviewer/admin approves a submission.
 * under_review -> approved
 * (Route-level requireRole("reviewer", "admin") enforces WHO can call this;
 * this function only enforces the state transition itself.)
 */
const approveReport = async (req, res) => {
    try {
        const { id } = req.body;
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const report = await Report_1.default.findById(id);
        if (!report || report.orgId?.toString() !== orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        if (report.reviewerId !== req.user.id) {
            return res.status(403).json({ message: 'Only the assigned reviewer can act on this report' });
        }
        if (report.status !== 'under_review') {
            return res.status(400).json({ message: `Cannot approve from status "${report.status}"` });
        }
        report.status = 'approved';
        report.reviewerId = req.user.id;
        await report.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.approved',
            targetType: 'Report',
            targetId: report.id,
            before: { status: 'under_review' },
            after: { status: 'approved', reviewerId: req.user.id },
        });
        await (0, notifications_1.createNotification)({
            userId: report.authorId ?? '',
            orgId,
            type: 'report_approved',
            message: `Your report "${report.title}" was approved and is pending final publish.`,
            link: `/report/${report.id}`,
        });
        res.json(report);
    }
    catch (err) {
        console.error('Error approving report:', err);
        res.status(500).json({ error: 'Failed to approve report' });
    }
};
exports.approveReport = approveReport;
/**
 * Reviewer/admin sends a submission back for changes, with a required
 * comment explaining why. under_review -> draft
 */
const requestChanges = async (req, res) => {
    try {
        const { id, comment } = req.body;
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!comment || !comment.trim()) {
            return res.status(400).json({ message: 'A comment is required when requesting changes' });
        }
        const report = await Report_1.default.findById(id);
        if (!report || report.orgId?.toString() !== orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        if (report.reviewerId !== req.user.id) {
            return res.status(403).json({ message: 'Only the assigned reviewer can act on this report' });
        }
        if (report.status !== 'under_review') {
            return res
                .status(400)
                .json({ message: `Cannot request changes from status "${report.status}"` });
        }
        report.reviewerComments.push({
            id: `${Date.now()}`,
            authorId: req.user.id,
            authorName: req.user.name,
            text: comment.trim(),
            createdAt: new Date(),
        });
        report.status = 'draft';
        report.reviewerId = req.user.id;
        await report.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.changes_requested',
            targetType: 'Report',
            targetId: report.id,
            before: { status: 'under_review' },
            after: { status: 'draft', comment: comment.trim() },
        });
        await (0, notifications_1.createNotification)({
            userId: report.authorId ?? '',
            orgId,
            type: 'changes_requested',
            message: `Changes were requested on "${report.title}". It's back in your drafts.`,
            link: `/report/${report.id}`,
        });
        res.json(report);
    }
    catch (err) {
        console.error('Error requesting changes:', err);
        res.status(500).json({ error: 'Failed to request changes' });
    }
};
exports.requestChanges = requestChanges;
/**
 * Reviewer/admin gives final publish sign-off. approved -> published
 */
const publishReport = async (req, res) => {
    try {
        const { id } = req.body;
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const report = await Report_1.default.findById(id);
        if (!report || report.orgId?.toString() !== orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        if (report.reviewerId !== req.user.id) {
            return res.status(403).json({ message: 'Only the assigned reviewer can act on this report' });
        }
        if (report.status !== 'approved') {
            return res.status(400).json({ message: `Cannot publish from status "${report.status}"` });
        }
        report.status = 'published';
        await report.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.published',
            targetType: 'Report',
            targetId: report.id,
            before: { status: 'approved' },
            after: { status: 'published' },
        });
        await (0, notifications_1.createNotification)({
            userId: report.authorId ?? '',
            orgId,
            type: 'report_published',
            message: `Your report "${report.title}" has been published.`,
            link: `/report/${report.id}`,
        });
        res.json(report);
    }
    catch (err) {
        console.error('Error publishing report:', err);
        res.status(500).json({ error: 'Failed to publish report' });
    }
};
exports.publishReport = publishReport;
/**
 * Reviewer/admin leaves an inline comment WITHOUT changing status —
 * separate from requestChanges, for feedback that doesn't need a full
 * send-back-to-draft cycle.
 */
const addReviewComment = async (req, res) => {
    try {
        const { id, comment } = req.body;
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!comment || !comment.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }
        const report = await Report_1.default.findById(id);
        if (!report || report.orgId?.toString() !== orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        report.reviewerComments.push({
            id: `${Date.now()}`,
            authorId: req.user.id,
            authorName: req.user.name,
            text: comment.trim(),
            createdAt: new Date(),
            replies: [],
        });
        await report.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.comment_added',
            targetType: 'Report',
            targetId: report.id,
            before: null,
            after: { comment: comment.trim() },
        });
        res.json(report);
    }
    catch (err) {
        console.error('Error adding review comment:', err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};
exports.addReviewComment = addReviewComment;
const replyToComment = async (req, res) => {
    try {
        const { id, commentId, text } = req.body;
        const userId = req.user?.id;
        const orgId = req.user?.orgId;
        if (!userId || !orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!commentId || !text || !text.trim()) {
            return res.status(400).json({ message: 'Reply text is required' });
        }
        const report = await Report_1.default.findById(id);
        if (!report || report.orgId?.toString() !== orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        const comment = report.reviewerComments.find((item) => item.id === commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const canReply = report.authorId?.toString() === userId ||
            comment.authorId?.toString() === userId ||
            req.user?.role === 'reviewer' ||
            req.user?.role === 'admin';
        if (!canReply) {
            return res.status(403).json({ message: 'You are not allowed to reply to this comment' });
        }
        comment.replies = comment.replies || [];
        comment.replies.push({
            id: `${Date.now()}`,
            authorId: userId,
            authorName: req.user.name,
            text: text.trim(),
            createdAt: new Date(),
        });
        await report.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.comment_replied',
            targetType: 'Report',
            targetId: report.id,
            before: null,
            after: { commentId, reply: text.trim() },
        });
        res.json(report);
    }
    catch (err) {
        console.error('Error replying to review comment:', err);
        res.status(500).json({ error: 'Failed to reply to comment' });
    }
};
exports.replyToComment = replyToComment;
