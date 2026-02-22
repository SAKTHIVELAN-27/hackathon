/**
 * GET /api/team/rounds
 *
 * Returns all rounds accessible to the team, also with:
 *  - round details (number, times, status)
 *  - whether the team has selected a subtask
 *  - whether the team has submitted work
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getTeamSession } from "@/lib/getTeamSession";
import Team from "@/models/Team";
import Round from "@/models/Round";
import RoundOptions from "@/models/RoundOptions";
import Submission from "@/models/Submission";
import { proxy } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GEThandler(request: NextRequest) {
  try {
    const { teamId } = await getTeamSession();

    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get all rounds the team can access
    // Logic: specific accessibility OR active OR submission enabled
    // Get all rounds and filter based on strict accessibility rules
    const allRounds = await Round.find({}).sort({ round_number: 1 });

    // Convert ObjectIds to strings for comparison
    const accessibleRoundIds = new Set(
      (team.rounds_accessible || []).map((id: any) => id.toString()),
    );

    const rounds = allRounds.filter((r) => {
      // Round 1: Open if active OR explicitly accessible
      if (r.round_number === 1) {
        return r.is_active || accessibleRoundIds.has(r._id.toString());
      }

      // Round > 1: STRICTLY requiring explicit access (via shortlisting)
      return accessibleRoundIds.has(r._id.toString());
    });

    const visibleRoundIds = rounds.map((r) => r._id);

    // Fetch selections and submissions for all accessible rounds in bulk
    const [selections, submissions] = await Promise.all([
      RoundOptions.find({
        team_id: teamId,
        round_id: { $in: visibleRoundIds },
      }),
      Submission.find({
        team_id: teamId,
        round_id: { $in: visibleRoundIds },
      }),
    ]);

    // Build lookup maps for O(1) access
    const selectionByRound = new Map(
      selections.map((s: any) => [s.round_id.toString(), s]),
    );
    const submissionByRound = new Map(
      submissions.map((s: any) => [s.round_id.toString(), s]),
    );

    const enrichedRounds = rounds.map((round: any) => {
      const roundIdStr = round._id.toString();
      const selection = selectionByRound.get(roundIdStr);
      const submission = submissionByRound.get(roundIdStr);

      return {
        _id: round._id,
        round_number: round.round_number,
        start_time: round.start_time,
        end_time: round.end_time,
        is_active: round.is_active,
        has_selected: !!selection,
        selected_subtask_id: selection?.selected ?? null,
        has_submitted: !!submission,
        submission_locked: submission?.is_locked ?? false,
      };
    });

    return NextResponse.json(enrichedRounds);
  } catch (err: any) {
    if (err.status && err.error) {
      return NextResponse.json({ error: err.error }, { status: err.status });
    }
    console.error("GET /api/team/rounds error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GEThandler, ["team"]);
