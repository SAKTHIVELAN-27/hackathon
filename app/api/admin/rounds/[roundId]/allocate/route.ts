import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import RoundOptions from "@/models/RoundOptions";
import { proxy } from "@/lib/proxy";

/**
 * POST /api/admin/rounds/[roundId]/allocate
 * Body: { allocations: [{ teamId: string; subtaskIds: [string, string] }] }
 *
 * Manually assigns exactly 2 subtask options to each team.
 * Team will then pick one from the 2 options themselves.
 * Does NOT set `selected` - that is the team's choice.
 */
async function POSTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  await connectDB();
  const { roundId } = await params;

  try {
    const body = await request.json();
    const allocations: { teamId: string; subtaskIds: string[] }[] =
      body.allocations || [];

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "allocations must be a non-empty array" },
        { status: 400 },
      );
    }

    await Promise.all(
      allocations.map(({ teamId, subtaskIds }) =>
        RoundOptions.findOneAndUpdate(
          { team_id: teamId, round_id: roundId },
          {
            team_id: teamId,
            round_id: roundId,
            options: subtaskIds,
            selected: null,
            selected_at: null,
          },
          { upsert: true, new: true },
        ),
      ),
    );

    return NextResponse.json({
      message: "Subtask options allocated successfully",
      count: allocations.length,
    });
  } catch (error) {
    console.error("Error allocating subtasks:", error);
    return NextResponse.json(
      { error: "Failed to allocate subtasks" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
