import { Request, Response } from 'express';
import Blog from '../models/Blog';
import User from '../models/User';

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { id, _id, title, content, authorId, authorName, hashtags, coverImage, authorAvatar, createdAt, isDraft } = req.body;
    const blogId = id || _id;
    if(blogId){
      updateBlog(req, res);
      return;
    }

    const newBlog = new Blog({
      title,
      content,
      authorId,
      authorName,
      hashtags,
      coverImage,
      authorAvatar,
      createdAt,
      isDraft,
    });

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  const blogId = req.body.id;
  const updateData = req.body;

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, { new: true });
    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

export const getAllBlogs = async (_req: Request, res: Response) => {
  try{
    /* const page = parseInt(_req.query.page as string) || 1;
    const limit = parseInt(_req.query.limit as string) || 10; */
    const includeDrafts = _req.query.includeDrafts === 'true';
    const filter = includeDrafts ? {} : { isDraft: false };
    const AllBlogs = await Blog.find(filter).sort({ createdAt: -1 })/* .skip(0).limit(20) */;
    const totalBlogs = await Blog.countDocuments();

    res.json({ blogs: AllBlogs, total: totalBlogs });
  }catch(err){
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

export const getAllUserBlogs = async (req: Request, res: Response) => {
  try{
    const filter = { authorId: req.query.userId };
    const AllBlogs = await Blog.find(filter).sort({ createdAt: -1 });
    const totalBlogs = await Blog.countDocuments();
    
    res.json({ blogs: AllBlogs, total: totalBlogs });
  }catch(err){
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch user blogs' });
  }
}

export const getById = async (req: Request, res: Response) => {
  try{
    const blog = await Blog.findById(req.params.id);
    const authorAvatar = await User.findById(blog?.authorId);
    if(blog){
      blog.authorAvatar = authorAvatar?.userProfileImage || '';
    }
    res.json( {blog});
  }catch(err){
    console.error('Error fetching blog data:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
}

export const deleteBlog = async (req: Request, res: Response) => {
  try{
    const blog = await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully', blog });
  }catch(err){
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
}
