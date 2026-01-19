
import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stravaId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    data: {
      type: Object, // Stores the full JSON activity detail
      required: true,
    },
    streams: {
      type: Object, // Stores the streams JSON
      required: false,
    },
    lastFetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add compound index for userId + stravaId
ActivitySchema.index({ userId: 1, stravaId: 1 });

export default mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
