import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

// Deliberately the ONLY exported function in this file. There is no
// create/update/delete here — those happen exclusively via logAction()
// in auditLogger.ts, never through an HTTP route. That's what makes
// "immutable" a structural property instead of just a comment.
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find({ orgId }).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const total = await AuditLog.countDocuments({ orgId });

    res.json({ logs, total });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
