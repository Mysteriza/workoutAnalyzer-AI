import mongoose, { Schema, Document } from "mongoose";

export interface IGlobalUsage extends Document {
  usageCount: number;
  lastReset: string;
  updatedAt: Date;
}

const GlobalUsageSchema: Schema<IGlobalUsage> = new Schema(
  {
    usageCount: { type: Number, default: 0 },
    lastReset: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.GlobalUsage || mongoose.model<IGlobalUsage>("GlobalUsage", GlobalUsageSchema);
