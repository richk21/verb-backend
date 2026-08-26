import mongoose, { Document, Schema } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    slug: string;
    createdAt: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrganization>("Organization", organizationSchema);