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
    },
  },
  { timestamps: true }
);

// Prevent model recompilation error in Next.js hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
