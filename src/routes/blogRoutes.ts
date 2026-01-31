import { Router } from 'express';
import { createBlog, deleteBlog, getAllBlogs, getAllUserBlogs, getById, updateBlog,   } from '../controllers/blogController';

const router = Router();

router.get('/publish', updateBlog);
router.post('/save', createBlog);
router.get('/getAll', getAllBlogs);
router.get('/getAllUserBlogs', getAllUserBlogs);
router.get('/getById/:id', getById);
router.delete('/delete/:id', deleteBlog);

export default router;