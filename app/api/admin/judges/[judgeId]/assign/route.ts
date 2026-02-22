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

    // Update judge's teams_assigned field
    await Judge.updateOne({ _id: judgeId }, { teams_assigned: teamIds });

    return NextResponse.json({
      message: `Updated team assignments for Judge ${judgeId}`,
      success: true,
      assignedCount: teamIds.length,
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
