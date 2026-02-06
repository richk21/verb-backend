import { Router } from 'express';
import { createBlog, deleteBlog, getAllBlogs, getAllUserBlogs, getById, updateBlog,   } from '../controllers/BlogController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/publish', authMiddleware, updateBlog);
router.post('/save', authMiddleware, createBlog);
router.get('/getAll', getAllBlogs);
router.get('/getAllUserBlogs', getAllUserBlogs);
router.get('/getById/:id', getById);
router.delete('/delete/:id', authMiddleware, deleteBlog);
export default router;