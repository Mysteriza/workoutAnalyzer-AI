import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  activityId: number; // Strava Activity ID
  content: string;
  createdAt: Date;
}

const AnalysisSchema: Schema<IAnalysis> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    activityId: { type: Number, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index to quickly find analysis for a specific user and activity
AnalysisSchema.index({ userId: 1, activityId: 1 }, { unique: true });

const Analysis: Model<IAnalysis> =
  mongoose.models.Analysis || mongoose.model<IAnalysis>("Analysis", AnalysisSchema);

export default Analysis;
