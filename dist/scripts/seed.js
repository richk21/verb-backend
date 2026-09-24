"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const Organization_1 = __importDefault(require("../models/Organization"));
const Report_1 = __importDefault(require("../models/Report"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
async function seed() {
    await mongoose_1.default.connect(process.env.MONGO_URI);
    const existing = await Organization_1.default.findOne({ slug: 'demo-fintech-org' });
    if (existing) {
        console.log('Demo org already seeded — skipping. Delete it manually to reseed.');
        await mongoose_1.default.disconnect();
        return;
    }
    const org = await Organization_1.default.create({ name: 'Demo Fintech Org', slug: 'demo-fintech-org' });
    const admin = await User_1.default.create({
        userName: 'Alex Admin',
        userEmail: 'admin@demo.verb',
        userPassword: 'Demo1234!', // hashed by the User model's pre-save hook
        orgId: org._id,
        role: 'admin',
        isVerified: true,
    });
    const reviewer = await User_1.default.create({
        userName: 'Rita Reviewer',
        userEmail: 'reviewer@demo.verb',
        userPassword: 'Demo1234!',
        orgId: org._id,
        role: 'reviewer',
        isVerified: true,
    });
    const contributor = await User_1.default.create({
        userName: 'Cody Contributor',
        userEmail: 'contributor@demo.verb',
        userPassword: 'Demo1234!',
        orgId: org._id,
        role: 'contributor',
        isVerified: true,
    });
    await Report_1.default.create([
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
    console.log('Login: admin@demo.verb / reviewer@demo.verb / contributor@demo.verb, password Demo1234!');
    await mongoose_1.default.disconnect();
}
seed();
