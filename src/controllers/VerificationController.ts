import crypto from "crypto";
import User from "../models/User";
import { Request, Response } from "express";
import { Resend } from "resend";
import { signUpMailTemplate } from "../utils/signUpMailTemplate";

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Verb <no-reply@send.verbblog.com>",
      to: user.userEmail,
      subject:
        "Welcome to Verb - where ideas compile into verbs and come to life",
      html: signUpMailTemplate(user.userName),
    });

    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};
