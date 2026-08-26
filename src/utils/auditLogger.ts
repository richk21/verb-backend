import { Request } from 'express';
import AuditLog, { AuditAction } from '../models/AuditLog';

interface LogActionParams {
  req: Request;
  action: AuditAction;
  targetType: 'Blog' | 'User';
  targetId: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Fire-and-forget audit write. Failures here are logged but never thrown —
 * an audit-log outage should never block the user-facing operation that
 * already succeeded. (Trade-off: a logging failure is only visible in
 * server logs, not surfaced anywhere else. A production compliance system
 * would want a dead-letter queue instead; not needed at this scale.)
 */
export const logAction = async ({
  req,
  action,
  targetType,
  targetId,
  before = null,
  after = null,
}: LogActionParams): Promise<void> => {
  try {
    if (!req.user) return; // shouldn't happen behind authMiddleware, stay defensive

    await AuditLog.create({
      orgId: req.user.orgId,
      actorId: req.user.id,
      actorRole: req.user.role,
      action,
      targetType,
      targetId,
      before,
      after,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error('[audit-log] Failed to write audit entry:', err);
  }
};
