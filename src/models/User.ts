import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    { id: this._id, email: this.userEmail, name: this.userName },
    process.env.JWT_SECRET as string,
    { expiresIn: "24h" },
  );
  return token;
};

export default mongoose.model<IUser>("User", userSchema);
