import { Router } from 'express';
import { getAuditLogs } from '../controllers/AuditLogController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Only auditor/admin can view the trail. Deliberately no
// POST/PATCH/DELETE route here at all — see AuditLogController.ts.
router.get('/', authMiddleware, requireRole('auditor', 'admin'), getAuditLogs);

export default router;
