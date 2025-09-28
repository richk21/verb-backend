import { Request, Response } from 'express';
import Post from '../models/Post';

export const getAllPosts = async (req: Request, res: Response) => {
  const posts = await Post.find();
  res.json(posts);
};

export const createPost = async (req: Request, res: Response) => {
  const { title, content, author } = req.body;
  const newPost = new Post({ title, content, author });
  await newPost.save();
  res.status(201).json(newPost);
};
