import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Judge from "@/models/Judge";
import { proxy } from "@/lib/proxy";

// GET: Fetch all judge assignments
async function GETHandler(_request: NextRequest) {
  await connectDB();

  try {
    // Fetch all judges with their assigned teams
    const judges = await Judge.find()
      .populate("user_id", "email")
      .populate("teams_assigned", "team_name")
      .populate("track_id", "name")
      .lean();

    // Map to a more useful format
    const assignmentData = judges.flatMap((judge: any) => {
      return (judge.teams_assigned || []).map((team: any) => ({
        judgeId: judge._id.toString(),
        judges_email: judge.user_id?.email,
        judge_name: judge.judge_name,
        teamId: team._id.toString(),
        teamName: team.team_name,
        track: judge.track_id?.name,
      }));
    });

    // Get list of all assigned team IDs
    const assignedTeamIds = [...new Set(assignmentData.map((a) => a.teamId))];

    return NextResponse.json({
      assignments: assignmentData,
      assignedTeamIds,
      judges: judges.map((j: any) => ({
        id: j._id.toString(),
        judge_name: j.judge_name,
        email: j.user_id?.email,
        track: j.track_id?.name,
        teams_count: (j.teams_assigned || []).length,
      })),
    });
  } catch (error) {
    console.error("Error fetching judge assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch judge assignments" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);
