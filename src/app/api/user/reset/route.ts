import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
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

    // @ts-ignore
    let userId = session.user.id;

    if (!userId) {
      // @ts-ignore
      const stravaId = session.user.stravaId;
      if (stravaId) {
        const user = await User.findOne({ stravaId });
        if (user) userId = user._id.toString();
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await Activity.deleteMany({ userId });
    await Analysis.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ success: true, message: "All user data has been deleted" });
  } catch (error) {
    console.error("Reset Data Error:", error);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
