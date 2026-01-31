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
      id: newUser.id,
      email: newUser.userEmail,
      name: newUser.userName,
    }, token });
  } catch (error) {
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
      id: user.id,
      email: user.userEmail,
      name: user.userName,
      coverImage: user.userCoverImage,
      profileImage: user.userProfileImage,
      bio: user.userBio,
    }, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const { userId, userName, userBio  } = req.body;

    const files = req.files as { [field: string]: Express.Multer.File[] };
    const profileFile = files?.["userProfileImage"]?.[0];
    const coverFile = files?.["userCoverImage"]?.[0];

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    user.userName = userName || user.userName;
    user.userBio = userBio || user.userBio;

     if (profileFile) {
      user.userProfileImage = profileFile.path;
    }

    if (coverFile) {
      user.userCoverImage = coverFile.path;
    }

    const updatedUser =  await user.save();
    
    res.status(200).json({ message: 'User updated successfully', user: {
      id: updatedUser.id,
      email: updatedUser.userEmail,
      name: updatedUser.userName,
      bio: updatedUser.userBio,
      profileImage: updatedUser.userProfileImage,
      coverImage: updatedUser.userCoverImage,
    } });

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-userPassword');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user:{
      name: user.userName,
      email: user.userEmail,
      bio: user.userBio,
      coverImage: user.userCoverImage,
      profileImage: user.userProfileImage,
      id: user.id,
    } });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
