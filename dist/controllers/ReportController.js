"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.getById = exports.getAllUserReports = exports.getAllReports = exports.updateReport = exports.createOrUpdateReport = void 0;
const Report_1 = __importStar(require("../models/Report"));
const User_1 = __importDefault(require("../models/User"));
const auditLogger_1 = require("../utils/auditLogger");
const createOrUpdateReport = async (req, res) => {
    try {
        const { id, _id, title, content, hashtags, coverImage, createdAt, isDraft, //legacy field
         } = req.body;
        const reportId = id || _id;
        if (reportId) {
            (0, exports.updateReport)(req, res);
            return;
        }
        const userId = req.user?.id;
        const orgId = req.user?.orgId;
        if (!userId || !orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const author = await User_1.default.findById(userId);
        const authorAvatar = author?.userProfileImage || '';
        const newReport = new Report_1.default({
            title,
            content,
            authorId: userId,
            orgId,
            hashtags,
            coverImage,
            authorAvatar,
            createdAt,
            status: isDraft === false ? Report_1.REPORT_STATUS.PUBLISHED : Report_1.REPORT_STATUS.DRAFT,
        });
        const savedReport = await newReport.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.created',
            targetType: 'Report',
            targetId: savedReport.id,
            before: null,
            after: { title: savedReport.title, status: savedReport.status },
        });
        res.status(201).json(savedReport);
    }
    catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
};
exports.createOrUpdateReport = createOrUpdateReport;
const updateReport = async (req, res) => {
    try {
        const reportId = req.body.id;
        if (!reportId)
            return res.status(400).json({ message: 'Missing report id' });
        const userId = req.user?.id;
        const orgId = req.user?.orgId;
        if (!userId || !orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const report = await Report_1.default.findById(reportId);
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        if (report.orgId?.toString() != orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        if (report.authorId?.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to edit this report' });
        }
        const disallowed = ['authorId', 'authorAvatar', 'createdAt', '_id', 'id', 'orgId'];
        disallowed.forEach((k) => delete req.body[k]);
        const beforeSnapshot = { title: report.title, status: report.status };
        //set status of the report back to DRAFT
        req.body.status = Report_1.REPORT_STATUS.DRAFT;
        const updatedReport = await Report_1.default.findByIdAndUpdate(reportId, req.body, {
            new: true,
        });
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.updated',
            targetType: 'Report',
            targetId: reportId,
            before: beforeSnapshot,
            after: updatedReport ? { title: updatedReport.title, status: updatedReport.status } : null,
        });
        res.json(updatedReport);
    }
    catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
};
exports.updateReport = updateReport;
const getAllReports = async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthrorized' });
        const filter = { orgId, status: 'published' };
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const AllReports = await Report_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const result = await Promise.all(AllReports.map(async (report) => {
            const author = await User_1.default.findById(report.authorId);
            return {
                ...report.toObject(),
                authorAvatar: author?.userProfileImage || '',
                authorName: author?.userName || '',
            };
        }));
        const totalReports = await Report_1.default.countDocuments(filter);
        res.json({ reports: result, total: totalReports });
    }
    catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};
exports.getAllReports = getAllReports;
const getAllUserReports = async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const filter = { orgId, authorId: req.query.userId };
        const showDrafts = req.query.getDrafts === 'true';
        const showPublished = req.query.getPublished === 'true';
        if (showDrafts !== showPublished) {
            filter.status = showDrafts ? 'draft' : 'published';
        }
        const reports = await Report_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const result = await Promise.all(reports.map(async (report) => {
            const author = await User_1.default.findById(report.authorId);
            return {
                ...report.toObject(),
                authorAvatar: author?.userProfileImage || '',
                authorName: author?.userName || '',
            };
        }));
        const totalReports = await Report_1.default.countDocuments(filter);
        res.json({ reports: result, total: totalReports });
    }
    catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Failed to fetch user reports' });
    }
};
exports.getAllUserReports = getAllUserReports;
const getById = async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const report = await Report_1.default.findById(req.params.id);
        if (!report || report.orgId?.toString() !== orgId) {
            return res.status(404).json({ message: 'Report not found' });
        }
        if (report.reviewerId) {
            const reviewer = await User_1.default.findById(report.reviewerId);
            report.reviewerName = reviewer?.userName || '';
        }
        const author = await User_1.default.findById(report?.authorId);
        report.authorAvatar = author?.userProfileImage || '';
        report.authorName = author?.userName || '';
        res.json(report);
    }
    catch (err) {
        console.error('Error fetching report data:', err);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};
exports.getById = getById;
const deleteReport = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orgId = req.user?.orgId;
        if (!userId || !orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const report = await Report_1.default.findById(req.params.id);
        if (!report || report.orgId?.toString() !== orgId)
            return res.status(404).json({ message: 'Report not found' });
        if (report.authorId?.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this report' });
        }
        await Report_1.default.findByIdAndDelete(req.params.id);
        await (0, auditLogger_1.logAction)({
            req,
            action: 'report.deleted',
            targetType: 'Report',
            targetId: req.params.id,
            before: { title: report.title, status: report.status },
            after: null,
        });
        res.json({ message: 'Report deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting report:', err);
        res.status(500).json({ error: 'Failed to delete report' });
    }
};
exports.deleteReport = deleteReport;
