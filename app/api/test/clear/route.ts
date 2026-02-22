import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import User from "@/models/User";
import Team from "@/models/Team";
import Round from "@/models/Round";
import Judge from "@/models/Judge";
import Track from "@/models/Track";
import Subtask from "@/models/Subtask";
import RoundOptions from "@/models/RoundOptions";
import Submission from "@/models/Submission";
import Score from "@/models/Score";

export async function GET() {
  try {
    await connectDB();

    const results = await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Round.deleteMany({}),
      Judge.deleteMany({}),
      Track.deleteMany({}),
      Subtask.deleteMany({}),
      RoundOptions.deleteMany({}),
      Submission.deleteMany({}),
      Score.deleteMany({}),
    ]);

    return NextResponse.json({
      message: "All data cleared successfully",
      deleted: {
        users: results[0].deletedCount,
        teams: results[1].deletedCount,
        rounds: results[2].deletedCount,
        judges: results[3].deletedCount,
        tracks: results[4].deletedCount,
        subtasks: results[5].deletedCount,
        roundOptions: results[6].deletedCount,
        submissions: results[7].deletedCount,
        scores: results[8].deletedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to clear data", details: error.message },
      { status: 500 },
    );
  }
}
