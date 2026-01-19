import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email?: string;
  image?: string;
  stravaId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  profile: {
    age?: number;
    weight?: number;
    height?: number;
    restingHeartRate?: number;
  };
  usageCount?: number;
  usageLastReset?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String },
    email: { type: String },
    image: { type: String },
    stravaId: { type: String, required: true, unique: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Number },
    profile: {
      age: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      restingHeartRate: { type: Number },
      preferredActivity: { type: String },
    },
    usageCount: { type: Number, default: 0 },
    usageLastReset: { type: String },
  },
  { timestamps: true }
);

// Prevent model recompilation error in Next.js hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
