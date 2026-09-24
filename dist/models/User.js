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
exports.USER_ROLES = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importStar(require("mongoose"));
exports.USER_ROLES = ['contributor', 'reviewer', 'auditor', 'admin'];
const userSchema = new mongoose_1.Schema({
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true },
    userPassword: { type: String, required: false },
    googleId: { type: String, required: false },
    userBio: { type: String, required: false },
    userCoverImage: { type: String, required: false },
    userProfileImage: { type: String, required: false },
    role: { type: String, enum: exports.USER_ROLES, default: 'contributor' },
    orgId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
});
userSchema.pre('save', async function (next) {
    if (!this.userPassword)
        return next();
    if (!this.isModified('userPassword'))
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    this.userPassword = await bcryptjs_1.default.hash(this.userPassword, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.userPassword);
};
userSchema.methods.generateAuthToken = function () {
    const token = jsonwebtoken_1.default.sign({
        id: this._id,
        email: this.userEmail,
        name: this.userName,
        role: this.role,
        orgId: this.orgId,
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return token;
};
exports.default = mongoose_1.default.model('User', userSchema);
