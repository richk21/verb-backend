import { Request, Response } from 'express';
import User from '../models/User';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { userName, userEmail, userPassword } = req.body;

    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const newUser = new User({ userName, userEmail, userPassword });
    await newUser.save();

    const token = newUser.generateAuthToken();
    res.status(201).json({ message: 'User created successfully', user: {
      email: newUser.userEmail,
      name: newUser.userName,
    }, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { userEmail, userPassword } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(userPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();
    res.status(200).json({ message: 'Login successful', user: {
      email: user.userEmail,
      name: user.userName,
    }, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
