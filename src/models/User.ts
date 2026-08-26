import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "contributor" | "reviewer" | "auditor" | "admin";
export const USER_ROLES: UserRole[] = [
  "contributor",
  "reviewer",
  "auditor",
  "admin",
]
export interface IUser extends Document {
  userName: string;
  userEmail: string;
  userPassword?: string;
  googleId?: string;
  userProfileImage?: string;
  userCoverImage?: string;
  userBio?: string;
  isVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  role: UserRole;
  orgId: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

const userSchema = new Schema<IUser>({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, unique: true },
  userPassword: { type: String, required: false },
  googleId: { type: String, required: false },
  userBio: { type: String, required: false },
  userCoverImage: { type: String, required: false },
  userProfileImage: { type: String, required: false },
  role: { type: String, enum: USER_ROLES, default: "contributor"},
  orgId: {type: Schema.Types.ObjectId, ref: "Organization", required: true},
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
});

userSchema.pre("save", async function (next) {
  if (!this.userPassword) return next();
  if (!this.isModified("userPassword")) return next();

  const salt = await bcrypt.genSalt(10);
  this.userPassword = await bcrypt.hash(this.userPassword, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return bcrypt.compare(candidatePassword, this.userPassword);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id, email: this.userEmail, name: this.userName, role: this.role, orgId: this.orgId },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" },
  );
  return token;
};

export default mongoose.model<IUser>("User", userSchema);
