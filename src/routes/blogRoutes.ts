import { Router } from 'express';
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getAllUserBlogs,
  getById,
  updateBlog,
} from '../controllers/BlogController';
import {
  addReviewComment,
  approveBlog,
  publishBlog,
  requestChanges,
  submitForReview,
} from '../controllers/ReviewController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { complianceScanner } from '../middleware/complianceScanner';

const router = Router();

// these are only allowed through users auth
router.get('/publish', authMiddleware, complianceScanner, updateBlog);
router.post('/save', authMiddleware, complianceScanner, createBlog);

//these public endpoints need to be having auth middleware as they're scoped by orgId
router.get('/getAll', authMiddleware, getAllBlogs);
router.get('/getAllUserBlogs', authMiddleware, getAllUserBlogs);
router.get('/getById/:id', authMiddleware, getById);
router.delete('/delete/:id', authMiddleware, deleteBlog);

// --- Review workflow ---
// submitForReview: the author only (checked inside the controller, no
// extra role needed — any contributor can submit their own work).
router.post('/submit-for-review', authMiddleware, submitForReview);
// Everything below requires reviewer or admin — enforced at the route
// layer so it's visible here at a glance, not buried in each function.
router.post('/approve', authMiddleware, requireRole('reviewer', 'admin'), approveBlog);
router.post('/request-changes', authMiddleware, requireRole('reviewer', 'admin'), requestChanges);
router.post('/publish-final', authMiddleware, requireRole('reviewer', 'admin'), publishBlog);
router.post('/comment', authMiddleware, requireRole('reviewer', 'admin'), addReviewComment);

export default router;
