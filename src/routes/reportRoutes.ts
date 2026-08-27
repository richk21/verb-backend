import { Router } from 'express';
import {
  createReport,
  deleteReport,
  getAllReports,
  getAllUserReports,
  getById,
  updateReport,
} from '../controllers/ReportController';
import {
  addReviewComment,
  approveReport,
  publishReport,
  requestChanges,
  submitForReview,
} from '../controllers/ReviewController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { complianceScanner } from '../middleware/complianceScanner';

const router = Router();

// these are only allowed through users auth
router.get('/publish', authMiddleware, complianceScanner, updateReport);
router.post('/save', authMiddleware, complianceScanner, createReport);

//these public endpoints need to be having auth middleware as they're scoped by orgId
router.get('/getAll', authMiddleware, getAllReports);
router.get('/getAllUserReports', authMiddleware, getAllUserReports);
router.get('/getById/:id', authMiddleware, getById);
router.delete('/delete/:id', authMiddleware, deleteReport);

// --- Review workflow ---
// submitForReview: the author only (checked inside the controller, no
// extra role needed — any contributor can submit their own work).
router.post('/submit-for-review', authMiddleware, submitForReview);
// Everything below requires reviewer or admin — enforced at the route
// layer so it's visible here at a glance, not buried in each function.
router.post('/approve', authMiddleware, requireRole('reviewer', 'admin'), approveReport);
router.post('/request-changes', authMiddleware, requireRole('reviewer', 'admin'), requestChanges);
router.post('/publish-final', authMiddleware, requireRole('reviewer', 'admin'), publishReport);
router.post('/comment', authMiddleware, requireRole('reviewer', 'admin'), addReviewComment);

export default router;
