"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserRole = exports.getAllOrgMembers = exports.getOrgMembers = exports.getUserProfile = exports.updateUserInfo = exports.googleAuth = exports.loginUser = exports.createUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const resend_1 = require("resend");
const Organization_1 = __importDefault(require("../models/Organization"));
const User_1 = __importStar(require("../models/User"));
const auditLogger_1 = require("../utils/auditLogger");
const googleAuth_1 = require("../utils/googleAuth");
const notifications_1 = require("../utils/notifications");
const signUpMailTemplate_1 = require("../utils/signUpMailTemplate");
const slugify = (name) => name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
const findOrCreateOrganization = async (organizationName) => {
    const slug = slugify(organizationName);
    let org = await Organization_1.default.findOne({ slug });
    let wasCreated = false;
    if (!org) {
        org = await Organization_1.default.create({ name: organizationName.trim(), slug });
        wasCreated = true;
    }
    return { org, wasCreated };
};
const createUser = async (req, res) => {
    try {
        const { userName, userEmail, userPassword, organizationName } = req.body;
        if (!organizationName || !organizationName.trim()) {
            return res.status(400).json({ message: 'Organization name is required' });
        }
        const existingUser = await User_1.default.findOne({ userEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(verificationToken).digest('hex');
        const { org, wasCreated } = await findOrCreateOrganization(organizationName);
        const newUser = new User_1.default({
            userName,
            userEmail,
            userPassword,
            orgId: org._id,
            role: wasCreated ? 'admin' : 'contributor',
            emailVerificationToken: hashedToken,
            emailVerificationExpires: Date.now() + 1000 * 60 * 60,
        });
        await newUser.save();
        // Send a link that points to the backend verification endpoint so clicking the
        // email verifies the token server-side and then redirects to the frontend.
        const verificationUrl = `${process.env.BACKEND_URL || ''}/api/verify-email/${verificationToken}`;
        const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        //send email notification
        await resend.emails.send({
            from: 'Verb <onboarding@resend.dev>',
            to: newUser.userEmail,
            subject: 'Verify your email for Verb',
            html: `
        <h2>Welcome to Verb</h2>
        <p>Please verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
        });
        res.status(201).json({
            message: 'Account created. Please verify your email before logging in.',
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};
exports.createUser = createUser;
const loginUser = async (req, res) => {
    try {
        const { userEmail, userPassword } = req.body;
        const user = await User_1.default.findOne({ userEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in',
            });
        }
        if (!user.userPassword) {
            return res.status(400).json({
                message: 'Please login with Google for password-less experience',
            });
        }
        const isMatch = await user.comparePassword(userPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = user.generateAuthToken();
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.userEmail,
                name: user.userName,
                coverImage: user.userCoverImage,
                profileImage: user.userProfileImage,
                bio: user.userBio,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};
exports.loginUser = loginUser;
const googleAuth = async (req, res) => {
    try {
        const { token, organizationName } = req.body;
        const payload = await (0, googleAuth_1.verifyGoogleToken)(token);
        if (!payload) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }
        const { email, name, picture, sub } = payload;
        let user = await User_1.default.findOne({ userEmail: email }); // if user already exists
        if (!user) {
            //first time google login: create user
            if (!organizationName || !organizationName.trim()) {
                return res
                    .status(400)
                    .json({ message: 'Organization name is required for first-time sign-in' });
            }
            const { org, wasCreated } = await findOrCreateOrganization(organizationName);
            user = await User_1.default.create({
                userEmail: email,
                userName: name,
                googleId: sub,
                userProfileImage: picture,
                userPassword: null,
                isVerified: true,
                orgId: org._id,
                role: wasCreated ? 'admin' : 'contributor',
            });
            const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
            const result = await resend.emails.send({
                from: 'Verb <onboarding@resend.dev>', // todo: change the email to verb reporting or something
                to: user.userEmail,
                subject: 'Welcome to Verb - where ideas compile into verbs and come to life',
                html: (0, signUpMailTemplate_1.signUpMailTemplate)(user.userName),
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
    }
    catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Google authentication failed' });
    }
};
exports.googleAuth = googleAuth;
const updateUserInfo = async (req, res) => {
    try {
        const authUserId = req.user?.id;
        if (!authUserId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { userName, userBio } = req.body;
        const files = req.files;
        const profileFile = files?.['userProfileImage']?.[0];
        const coverFile = files?.['userCoverImage']?.[0];
        const user = await User_1.default.findById(authUserId);
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
        const updatedUser = await user.save();
        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.userEmail,
                name: updatedUser.userName,
                bio: updatedUser.userBio,
                profileImage: updatedUser.userProfileImage,
                coverImage: updatedUser.userCoverImage,
                role: updatedUser.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};
exports.updateUserInfo = updateUserInfo;
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User_1.default.findById(userId).select('-userPassword');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            user: {
                id: user.id,
                name: user.userName,
                email: user.userEmail,
                bio: user.userBio,
                coverImage: user.userCoverImage,
                profileImage: user.userProfileImage,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
};
exports.getUserProfile = getUserProfile;
const getOrgMembers = async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const rolesParam = req.query.roles || 'reviewer,admin';
        const roles = rolesParam.split(',');
        const members = await User_1.default.find({
            orgId,
            role: { $in: roles },
            _id: { $ne: userId }, // never list yourself — you can't assign yourself as reviewer
        }).select('userName userEmail userProfileImage role');
        res.json({
            members: members.map((m) => ({
                id: m.id,
                name: m.userName,
                email: m.userEmail,
                profileImage: m.userProfileImage,
                role: m.role,
            })),
        });
    }
    catch (err) {
        console.error('Error fetching org members:', err);
        res.status(500).json({ error: 'Failed to fetch org members' });
    }
};
exports.getOrgMembers = getOrgMembers;
const getAllOrgMembers = async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ message: 'Unauthorized' });
        const members = await User_1.default.find({ orgId }).select('userName userEmail userProfileImage role');
        res.json({
            members: members.map((m) => ({
                id: m.id,
                name: m.userName,
                email: m.userEmail,
                profileImage: m.userProfileImage,
                role: m.role,
            })),
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch organization members' });
    }
};
exports.getAllOrgMembers = getAllOrgMembers;
const changeUserRole = async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const actorId = req.user?.id;
        const { role } = req.body;
        const targetUserId = req.params.id;
        if (!orgId || !actorId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!User_1.USER_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        if (targetUserId === actorId) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }
        const targetUser = await User_1.default.findOne({ _id: targetUserId, orgId });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found in your organization' });
        }
        const previousRole = targetUser.role;
        targetUser.role = role;
        await targetUser.save();
        await (0, auditLogger_1.logAction)({
            req,
            action: 'user.role_changed',
            targetType: 'User',
            targetId: targetUser.id,
            before: { role: previousRole },
            after: { role },
        });
        await (0, notifications_1.createNotification)({
            userId: targetUser.id,
            orgId,
            type: 'role_changed',
            message: `Your role was changed from ${previousRole} to ${role} by ${req.user.name}.`,
            link: '/profile',
        });
        res.json({ id: targetUser.id, role: targetUser.role });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to change role' });
    }
};
exports.changeUserRole = changeUserRole;
