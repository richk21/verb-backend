import { Request, Response } from 'express';
import { IBlogFilters } from '../interfaces/blogFilters';
import Blog from '../models/Blog';
import User from '../models/User';
import { logAction } from '../utils/auditLogger';

export const createBlog = async (req: Request, res: Response) => {
  try {
    const {
      id,
      _id,
      title,
      content,
      hashtags,
      coverImage,
      createdAt,
      isDraft, //legacy field
    } = req.body;
    const blogId = id || _id;
    if (blogId) {
      updateBlog(req, res);
      return;
    }

    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const author = await User.findById(userId);
    const authorAvatar = author?.userProfileImage || '';

    const newBlog = new Blog({
      title,
      content,
      authorId: userId,
      orgId,
      hashtags,
      coverImage,
      authorAvatar,
      createdAt,
      status: isDraft === false ? 'published' : 'draft',
    });

    const savedBlog = await newBlog.save();
    await logAction({
      req,
      action: 'blog.created',
      targetType: 'Blog',
      targetId: savedBlog.id,
      before: null,
      after: { title: savedBlog.title, status: savedBlog.status },
    });

    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const blogId = req.body.id;
    if (!blogId) return res.status(400).json({ message: 'Missing blog id' });

    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.orgId?.toString() != orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this blog' });
    }

    const disallowed = ['authorId', 'authorAvatar', 'createdAt', '_id', 'id', 'orgId'];
    disallowed.forEach((k) => delete req.body[k]);

    const beforeSnapshot = { title: blog.title, status: blog.status };

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, req.body, {
      new: true,
    });

    await logAction({
      req,
      action: 'blog.updated',
      targetType: 'Blog',
      targetId: blogId,
      before: beforeSnapshot,
      after: updatedBlog ? { title: updatedBlog.title, status: updatedBlog.status } : null,
    });

    res.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthrorized' });

    const filter = { orgId, status: 'published' as const };
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const AllBlogs = await Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const result = await Promise.all(
      AllBlogs.map(async (blog) => {
        const author = await User.findById(blog.authorId);
        return {
          ...blog.toObject(),
          authorAvatar: author?.userProfileImage || '',
          authorName: author?.userName || '',
        };
      })
    );
    const totalBlogs = await Blog.countDocuments(filter);

    res.json({ blogs: result, total: totalBlogs });
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

export const getAllUserBlogs = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const filter: IBlogFilters = { orgId, authorId: req.query.userId as string };
    const showDrafts = req.query.getDrafts === 'true';
    const showPublished = req.query.getPublished === 'true';
    if (showDrafts !== showPublished) {
      filter.status = showDrafts ? 'draft' : 'published';
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const result = await Promise.all(
      blogs.map(async (blog) => {
        const author = await User.findById(blog.authorId);
        return {
          ...blog.toObject(),
          authorAvatar: author?.userProfileImage || '',
          authorName: author?.userName || '',
        };
      })
    );
    const totalBlogs = await Blog.countDocuments(filter);

    res.json({ blogs: result, total: totalBlogs });
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch user blogs' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.orgId?.toString() !== orgId) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const author = await User.findById(blog?.authorId);
    blog.authorAvatar = author?.userProfileImage || '';
    blog.authorName = author?.userName || '';

    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog data:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.orgId;
    if (!userId || !orgId) return res.status(401).json({ message: 'Unauthorized' });

    const blog = await Blog.findById(req.params.id);
    if (!blog || blog.orgId?.toString() !== orgId)
      return res.status(404).json({ message: 'Blog not found' });

    if (blog.authorId?.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);

    await logAction({
      req,
      action: 'blog.deleted',
      targetType: 'Blog',
      targetId: req.params.id,
      before: { title: blog.title, status: blog.status },
      after: null,
    });

    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};
