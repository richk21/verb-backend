import { Request, Response } from "express";
import User from "../models/User";
import { verifyGoogleToken } from "../utils/googleAuth";
import { Resend } from "resend";
import { signUpMailTemplate } from "../utils/signUpMailTemplate";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { userName, userEmail, userPassword } = req.body;

    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUser = new User({ userName, userEmail, userPassword });
    await newUser.save();

    const token = newUser.generateAuthToken();
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.userEmail,
        name: newUser.userName,
      },
      token,
    });
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Verb <onboarding@resend.dev>",
      to: newUser.userEmail,
      subject:
        "Welcome to Verb - where ideas compile into verbs and come to life",
      html: signUpMailTemplate(newUser.userName),
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { userEmail, userPassword } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.userPassword) {
      return res.status(400).json({
        message: "Please login with Google for password-less experience",
      });
    }

    const isMatch = await user.comparePassword(userPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = user.generateAuthToken();
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.userEmail,
        name: user.userName,
        coverImage: user.userCoverImage,
        profileImage: user.userProfileImage,
        bio: user.userBio,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ userEmail: email }); // if user already exists

    if (!user) {
      //first time google login: create user
      user = await User.create({
        userEmail: email,
        userName: name,
        googleId: sub,
        userProfileImage: picture,
        userPassword: null,
      });

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Verb <onboarding@resend.dev>",
        to: user.userEmail,
        subject:
          "Welcome to Verb - where ideas compile into verbs and come to life",
        html: signUpMailTemplate(user.userName),
      });
    }

    const jwtToken = user.generateAuthToken();

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.userName,
        email: user.userEmail,
        bio: user.userBio,
        profileImage: user.userProfileImage,
        coverImage: user.userCoverImage,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google authentication failed" });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) return res.status(401).json({ message: "Unauthorized" });

    const { userName, userBio } = req.body;
    const files = req.files as { [field: string]: Express.Multer.File[] };
    const profileFile = files?.["userProfileImage"]?.[0];
    const coverFile = files?.["userCoverImage"]?.[0];

    const user = await User.findById(authUserId);
    if (!user) {
      return res.status(400).json({ message: "Invalid user" });
    }

    user.userName = userName || user.userName;
    user.userBio = userBio || user.userBio;

    if (profileFile) {
      user.userProfileImage = profileFile.path;
    }

    if (coverFile) {
      user.userCoverImage = coverFile.path;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.userEmail,
        name: updatedUser.userName,
        bio: updatedUser.userBio,
        profileImage: updatedUser.userProfileImage,
        coverImage: updatedUser.userCoverImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-userPassword");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      user: {
        name: user.userName,
        email: user.userEmail,
        bio: user.userBio,
        coverImage: user.userCoverImage,
        profileImage: user.userProfileImage,
        id: user.id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
