/**
 * GET /api/team/submission
 *
 * Returns the full submission history for the authenticated team.
 * Each entry is augmented with the round number and the score given
 * by any judge (most recent if multiple).
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getTeamSession } from "@/lib/getTeamSession";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { proxy } from "@/lib/proxy";

async function GETHandler(_request: NextRequest) {
  try {
    const { teamId } = await getTeamSession();

    await connectDB();

    // Fetch all submissions, populate the round so we can return round_number
    const submissions = await Submission.find({ team_id: teamId })
      .populate("round_id", "round_number start_time end_time")
      .sort({ submitted_at: -1 })
      .lean();

    if (submissions.length === 0) {
      return NextResponse.json([]);
    }

    const submissionIds = submissions.map((s: any) => s._id);

    // Fetch ALL scores for these submissions (by any judge)
    // We'll use the most recently updated score per submission
    const scores = await Score.find({
      submission_id: { $in: submissionIds },
    })
      .sort({ updated_at: -1 })
      .lean();

    // Build a map: submissionId → best score entry
    const scoreMap = new Map<string, any>();
    for (const sc of scores) {
      const key = sc.submission_id.toString();
      if (!scoreMap.has(key)) {
        // First entry is most recent (sorted above)
        scoreMap.set(key, sc);
      }
    }

    const result = submissions.map((sub: any) => {
      const scoreEntry = scoreMap.get(sub._id.toString());
      return {
        _id: sub._id.toString(),
        round_id: sub.round_id
          ? {
              _id: sub.round_id._id?.toString?.() ?? sub.round_id.toString(),
              round_number: (sub.round_id as any).round_number,
            }
          : null,
        submitted_at: sub.submitted_at,
        github_link: sub.github_link || null,
        file_url: sub.file_url || null,
        overview: sub.overview || null,
        score: scoreEntry
          ? {
              score: scoreEntry.score,
              remarks: scoreEntry.remarks || "",
              status: scoreEntry.status,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.status && err.error) {
      return NextResponse.json({ error: err.error }, { status: err.status });
    }
    console.error("GET /api/team/submission error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["team"]);
