import { NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Activity from "@/models/Activity";
import Analysis from "@/models/Analysis";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // userId is always available from JWT
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User session invalid" },
        { status: 401 }
      );
    }

    // Use MongoDB transaction for atomic deletion
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      await Activity.deleteMany({ userId }, { session: dbSession });
      await Analysis.deleteMany({ userId }, { session: dbSession });
      await User.findByIdAndDelete(userId, { session: dbSession });

      await dbSession.commitTransaction();
    } catch (error) {
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }

    // Invalidate the session after deletion
    // Use a redirect to force sign-out
    await signOut({ redirect: false });

    return NextResponse.json({
      success: true,
      message: "All user data has been deleted. Please sign in again.",
      requireReauth: true,
    });
  } catch (error) {
    console.error("Reset Data Error:", error);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
