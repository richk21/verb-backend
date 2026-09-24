"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
/**
 * Fire-and-forget audit write. Failures here are logged but never thrown —
 * an audit-log outage should never block the user-facing operation that
 * already succeeded. (Trade-off: a logging failure is only visible in
 * server logs, not surfaced anywhere else. A production compliance system
 * would want a dead-letter queue instead; not needed at this scale.)
 */
const logAction = async ({ req, action, targetType, targetId, before = null, after = null, }) => {
    try {
        if (!req.user)
            return; // shouldn't happen behind authMiddleware, stay defensive
        await AuditLog_1.default.create({
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
    }
    catch (err) {
        console.error('[audit-log] Failed to write audit entry:', err);
    }
};
exports.logAction = logAction;
