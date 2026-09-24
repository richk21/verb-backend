"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportController_1 = require("../controllers/ReportController");
const ReviewController_1 = require("../controllers/ReviewController");
const auth_1 = require("../middleware/auth");
const complianceScanner_1 = require("../middleware/complianceScanner");
const router = (0, express_1.Router)();
// these are only allowed through users auth
router.post('/save', auth_1.authMiddleware, complianceScanner_1.complianceScanner, ReportController_1.createOrUpdateReport);
//these public endpoints need to be having auth middleware as they're scoped by orgId
router.get('/getAll', auth_1.authMiddleware, ReportController_1.getAllReports);
router.get('/getAllUserReports', auth_1.authMiddleware, ReportController_1.getAllUserReports);
router.get('/getById/:id', auth_1.authMiddleware, ReportController_1.getById);
router.delete('/delete/:id', auth_1.authMiddleware, ReportController_1.deleteReport);
// --- Review workflow ---
// submitForReview: the author only (checked inside the controller, no
// extra role needed — any contributor can submit their own work).
router.post('/submit-for-review', auth_1.authMiddleware, ReviewController_1.submitForReview);
// Everything below requires reviewer or admin — enforced at the route
// layer so it's visible here at a glance, not buried in each function.
router.post('/approve', auth_1.authMiddleware, (0, auth_1.requireRole)('reviewer', 'admin'), ReviewController_1.approveReport);
router.post('/request-changes', auth_1.authMiddleware, (0, auth_1.requireRole)('reviewer', 'admin'), ReviewController_1.requestChanges);
router.post('/publish-final', auth_1.authMiddleware, (0, auth_1.requireRole)('reviewer', 'admin'), ReviewController_1.publishReport);
router.post('/comment', auth_1.authMiddleware, (0, auth_1.requireRole)('reviewer', 'admin'), ReviewController_1.addReviewComment);
router.post('/comment/reply', auth_1.authMiddleware, ReviewController_1.replyToComment);
exports.default = router;
