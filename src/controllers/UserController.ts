import crypto from 'crypto';
import { Request, Response } from 'express';
import { Resend } from 'resend';
import Organization from '../models/Organization';
import User, { USER_ROLES, UserRole } from '../models/User';
import { logAction } from '../utils/auditLogger';
import { verifyGoogleToken } from '../utils/googleAuth';
import { createNotification } from '../utils/notifications';
import { signUpMailTemplate } from '../utils/signUpMailTemplate';

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const findOrCreateOrganization = async (organizationName: string) => {
  const slug = slugify(organizationName);
  let org = await Organization.findOne({ slug });
  let wasCreated = false;

  if (!org) {
    org = await Organization.create({ name: organizationName.trim(), slug });
    wasCreated = true;
  }

  return { org, wasCreated };
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { userName, userEmail, userPassword, organizationName } = req.body;

    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ message: 'Organization name is required' });
    }

    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const { org, wasCreated } = await findOrCreateOrganization(organizationName);

    const newUser = new User({
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
    const resend = new Resend(process.env.RESEND_API_KEY);

    //send email notification
    await resend.emails.send({
      from: 'Verb <no-reply@send.verbblog.com>',
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
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token, organizationName } = req.body;
    const payload = await verifyGoogleToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ userEmail: email }); // if user already exists

    if (!user) {
      //first time google login: create user
      if (!organizationName || !organizationName.trim()) {
        return res
          .status(400)
          .json({ message: 'Organization name is required for first-time sign-in' });
      }

      const { org, wasCreated } = await findOrCreateOrganization(organizationName);

      user = await User.create({
        userEmail: email,
        userName: name,
        googleId: sub,
        userProfileImage: picture,
        userPassword: null,
        isVerified: true,
        orgId: org._id,
        role: wasCreated ? 'admin' : 'contributor',
      });

      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: 'Verb <no-reply@send.verbblog.com>', // todo: change the email to verb reporting or something
        to: user.userEmail,
        subject: 'Welcome to Verb - where ideas compile into verbs and come to life',
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
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) return res.status(401).json({ message: 'Unauthorized' });

    const { userName, userBio } = req.body;
    const files = req.files as { [field: string]: Express.Multer.File[] };
    const profileFile = files?.['userProfileImage']?.[0];
    const coverFile = files?.['userCoverImage']?.[0];

    const user = await User.findById(authUserId);
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
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getOrgMembers = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const rolesParam = (req.query.roles as string) || 'reviewer,admin';
    const roles = rolesParam.split(',');

    const members = await User.find({
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
  } catch (err) {
    console.error('Error fetching org members:', err);
    res.status(500).json({ error: 'Failed to fetch org members' });
  }
};

export const getAllOrgMembers = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ message: 'Unauthorized' });

    const members = await User.find({ orgId }).select('userName userEmail userProfileImage role');
    res.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.userName,
        email: m.userEmail,
        profileImage: m.userProfileImage,
        role: m.role,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organization members' });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.orgId;
    const actorId = req.user?.id;
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!orgId || !actorId) return res.status(401).json({ message: 'Unauthorized' });
    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (targetUserId === actorId) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const targetUser = await User.findOne({ _id: targetUserId, orgId });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found in your organization' });
    }

    const previousRole = targetUser.role;
    targetUser.role = role as UserRole;
    await targetUser.save();

    await logAction({
      req,
      action: 'user.role_changed',
      targetType: 'User',
      targetId: targetUser.id,
      before: { role: previousRole },
      after: { role },
    });

    await createNotification({
      userId: targetUser.id,
      orgId,
      type: 'role_changed',
      message: `Your role was changed from ${previousRole} to ${role} by ${req.user!.name}.`,
      link: '/profile',
    });

    res.json({ id: targetUser.id, role: targetUser.role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change role' });
  }
};
