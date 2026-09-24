"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuditLogController_1 = require("../controllers/AuditLogController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Only auditor/admin can view the trail. Deliberately no
// POST/PATCH/DELETE route here at all — see AuditLogController.ts.
router.get('/', auth_1.authMiddleware, (0, auth_1.requireRole)('auditor', 'admin'), AuditLogController_1.getAuditLogs);
exports.default = router;
