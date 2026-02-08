import { Request, Response } from "express";
import Blog from "../models/Blog";
import User from "../models/User";
import { IBlogFilters } from "../interfaces/blogFilters";

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
      isDraft,
    } = req.body;
    const blogId = id || _id;
    if (blogId) {
      updateBlog(req, res);
      return;
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const author = await User.findById(userId);
    const authorAvatar = author?.userProfileImage || "";

    const newBlog = new Blog({
      title,
      content,
      authorId: userId,
      hashtags,
      coverImage,
      authorAvatar,
      createdAt,
      isDraft,
    });

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Failed to create blog" });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const blogId = req.body.id;
    if (!blogId) return res.status(400).json({ message: "Missing blog id" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.authorId?.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this blog" });
    }

    const disallowed = ["authorId", "authorAvatar", "createdAt", "_id", "id"];
    disallowed.forEach((k) => delete req.body[k]);

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, req.body, {
      new: true,
    });
    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Failed to update blog" });
  }
};

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const filter = { isDraft: false };
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const AllBlogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const result = await Promise.all(
      AllBlogs.map(async (blog) => {
        const author = await User.findById(blog.authorId);
        return {
          ...blog.toObject(),
          authorAvatar: author?.userProfileImage || "",
          authorName: author?.userName || "",
        };
      }),
    );
    const totalBlogs = await Blog.countDocuments(filter);

    res.json({ blogs: result, total: totalBlogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
};

export const getAllUserBlogs = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const filter: IBlogFilters = { authorId: req.query.userId as string };
    const showDrafts = req.query.getDrafts === "true";
    const showPublished = req.query.getPublished === "true";
    if (showDrafts !== showPublished) {
      filter.isDraft = showDrafts;
    }

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const result = await Promise.all(
      blogs.map(async (blog) => {
        const author = await User.findById(blog.authorId);
        return {
          ...blog.toObject(),
          authorAvatar: author?.userProfileImage || "",
          authorName: author?.userName || "",
        };
      }),
    );
    const totalBlogs = await Blog.countDocuments(filter);

    res.json({ blogs: result, total: totalBlogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ error: "Failed to fetch user blogs" });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    const author = await User.findById(blog?.authorId);
    if (blog) {
      blog.authorAvatar = author?.userProfileImage || "";
      blog.authorName = author?.userName || "";
    }
    res.json(blog);
  } catch (err) {
    console.error("Error fetching blog data:", err);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.authorId?.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ error: "Failed to delete blog" });
  }
};
