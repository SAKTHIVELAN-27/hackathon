import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Judge from "@/models/Judge";
import { proxy } from "@/lib/proxy";

async function POSTHandler(
  request: NextRequest,
  context: { params: Promise<{ judgeId: string }> },
) {
  await connectDB();
  const { judgeId } = await context.params;

  try {
    const body = await request.json();
    const { teamIds } = body;

    if (!Array.isArray(teamIds)) {
      return NextResponse.json(
        { error: "teamIds must be an array" },
        { status: 400 },
      );
    }

    // Deduplicate and update judge's teams_assigned field
    const uniqueTeamIds = [...new Set(teamIds.map((id: string) => id.toString()))];
    await Judge.updateOne({ _id: judgeId }, { teams_assigned: uniqueTeamIds });

    return NextResponse.json({
      message: `Updated team assignments for Judge ${judgeId}`,
      success: true,
      assignedCount: uniqueTeamIds.length,
    });
  } catch (error) {
    console.error("Error assigning teams:", error);
    return NextResponse.json(
      { error: "Failed to assign teams" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
