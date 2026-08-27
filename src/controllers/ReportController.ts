import { Request, Response } from 'express';
import { IReportFilters } from '../interfaces/reportFilters';
import Report from '../models/Report';
import User from '../models/User';
import { logAction } from '../utils/auditLogger';

export const createReport = async (req: Request, res: Response) => {
  try {
    const {
      id,
      _id,
      title,
      content,
      hashtags,
      coverImage,
      createdAt,
      isDraft, //legacy field
    } = req.body;
    const reportId = id || _id;
    if (reportId) {
      updateReport(req, res);
      return;
    }

    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const author = await User.findById(userId);
    const authorAvatar = author?.userProfileImage || '';

    const newReport = new Report({
      title,
      content,
      authorId: userId,
      orgId,
      hashtags,
      coverImage,
      authorAvatar,
      createdAt,
      status: isDraft === false ? 'published' : 'draft',
    });

    const savedReport = await newReport.save();
    await logAction({
      req,
      action: 'report.created',
      targetType: 'Report',
      targetId: savedReport.id,
      before: null,
      after: { title: savedReport.title, status: savedReport.status },
    });

    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

export const updateReport = async (req: Request, res: Response) => {
  try {
    const reportId = req.body.id;
    if (!reportId) return res.status(400).json({ message: 'Missing report id' });

    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.orgId?.toString() != orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this report' });
    }

    const disallowed = ['authorId', 'authorAvatar', 'createdAt', '_id', 'id', 'orgId'];
    disallowed.forEach((k) => delete req.body[k]);

    const beforeSnapshot = { title: report.title, status: report.status };

    const updatedReport = await Report.findByIdAndUpdate(reportId, req.body, {
      new: true,
    });

    await logAction({
      req,
      action: 'report.updated',
      targetType: 'Report',
      targetId: reportId,
      before: beforeSnapshot,
      after: updatedReport ? { title: updatedReport.title, status: updatedReport.status } : null,
    });

    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthrorized' });

    const filter = { orgId, status: 'published' as const };
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const AllReports = await Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const result = await Promise.all(
      AllReports.map(async (report) => {
        const author = await User.findById(report.authorId);
        return {
          ...report.toObject(),
          authorAvatar: author?.userProfileImage || '',
          authorName: author?.userName || '',
        };
      })
    );
    const totalReports = await Report.countDocuments(filter);

    res.json({ reports: result, total: totalReports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getAllUserReports = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const filter: IReportFilters = { orgId, authorId: req.query.userId as string };
    const showDrafts = req.query.getDrafts === 'true';
    const showPublished = req.query.getPublished === 'true';
    if (showDrafts !== showPublished) {
      filter.status = showDrafts ? 'draft' : 'published';
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const result = await Promise.all(
      reports.map(async (report) => {
        const author = await User.findById(report.authorId);
        return {
          ...report.toObject(),
          authorAvatar: author?.userProfileImage || '',
          authorName: author?.userName || '',
        };
      })
    );
    const totalReports = await Report.countDocuments(filter);

    res.json({ reports: result, total: totalReports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch user reports' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const report = await Report.findById(req.params.id);
    if (!report || report.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const author = await User.findById(report?.authorId);
    report.authorAvatar = author?.userProfileImage || '';
    report.authorName = author?.userName || '';

    res.json(report);
  } catch (err) {
    console.error('Error fetching report data:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const report = await Report.findById(req.params.id);
    if (!report || report.orgId?.toString() !== orgId)
      return res.status(404).json({ message: 'Report not found' });

    if (report.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await Report.findByIdAndDelete(req.params.id);

    await logAction({
      req,
      action: 'report.deleted',
      targetType: 'Report',
      targetId: req.params.id,
      before: { title: report.title, status: report.status },
      after: null,
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
