"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = void 0;
const crypto_1 = __importDefault(require("crypto"));
const resend_1 = require("resend");
const User_1 = __importDefault(require("../models/User"));
const signUpMailTemplate_1 = require("../utils/signUpMailTemplate");
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.default.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Verb <no-reply@send.verbblog.com>', // todo: change this to verb reporting or something
            to: user.userEmail,
            subject: 'Welcome to Verb - where ideas compile into verbs and come to life',
            html: (0, signUpMailTemplate_1.signUpMailTemplate)(user.userName),
        });
        // Redirect back to frontend login with a query param to show success state.
        res.redirect(`${process.env.FRONTEND_URL || process.env.CLIENT_URL}/login?verified=true`);
    }
    catch (error) {
        res.status(500).json({ message: 'Verification failed' });
    }
};
exports.verifyEmail = verifyEmail;
