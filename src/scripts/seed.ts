import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Organization from '../models/Organization';
import Report from '../models/Report';
import User from '../models/User';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI as string);

  const existing = await Organization.findOne({ slug: 'demo-fintech-org' });
  if (existing) {
    console.log('Demo org already seeded — skipping. Delete it manually to reseed.');
    await mongoose.disconnect();
    return;
  }

  const org = await Organization.create({ name: 'Demo Fintech Org', slug: 'demo-fintech-org' });

  const admin = await User.create({
    userName: 'Alex Admin',
    userEmail: 'admin@demo.verb',
    userPassword: 'Demo1234!', // hashed by the User model's pre-save hook
    orgId: org._id,
    role: 'admin',
    isVerified: true,
  });

  const reviewer = await User.create({
    userName: 'Rita Reviewer',
    userEmail: 'reviewer@demo.verb',
    userPassword: 'Demo1234!',
    orgId: org._id,
    role: 'reviewer',
    isVerified: true,
  });

  const contributor = await User.create({
    userName: 'Cody Contributor',
    userEmail: 'contributor@demo.verb',
    userPassword: 'Demo1234!',
    orgId: org._id,
    role: 'contributor',
    isVerified: true,
  });

  await Report.create([
    {
      title: 'Payment API — Elevated Latency',
      content: 'Root cause: connection pool exhaustion under peak load...',
      authorId: contributor.id,
      orgId: org._id,
      status: 'published',
      hashtags: ['payments', 'latency'],
      createdAt: new Date().toISOString(),
    },
    {
      title: 'Auth Service — Token Refresh Failure',
      content: 'Draft investigation, root cause not yet confirmed...',
      authorId: contributor.id,
      orgId: org._id,
      status: 'under_review',
      reviewerId: reviewer.id,
      hashtags: ['auth'],
      createdAt: new Date().toISOString(),
    },
  ]);

  console.log('Seeded demo org with admin/reviewer/contributor accounts.');
  console.log(
    'Login: admin@demo.verb / reviewer@demo.verb / contributor@demo.verb, password Demo1234!'
  );
  await mongoose.disconnect();
}

seed();
