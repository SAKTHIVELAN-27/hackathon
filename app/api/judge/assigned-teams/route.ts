import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Judge from "@/models/Judge";
import Team from "@/models/Team";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { proxy } from "@/lib/proxy";

/**
 * GET /api/judge/assigned-teams
 * GET /api/judge/assigned-teams?round_id=<id>
 *
 * Returns the list of teams assigned to the authenticated judge.
 * If `round_id` is supplied, augments each team with submission + score
 * status for that specific round. Otherwise returns overall scoring status.
 */
async function GETHandler(request: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const judge = await Judge.findOne({ user_id: user._id }).lean();
  if (!judge) {
    return NextResponse.json({ error: "Judge not found" }, { status: 404 });
  }

  const assignedTeamIds: any[] = (judge as any).teams_assigned ?? [];
  if (assignedTeamIds.length === 0) {
    return NextResponse.json([]);
  }

  const teams = await Team.find({ _id: { $in: assignedTeamIds } })
    .select("_id team_name track_id")
    .lean();

  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get("round_id");

  if (roundId) {
    // ── Round-specific: find submission + score for each team ──
    const submissions = await Submission.find({
      team_id: { $in: assignedTeamIds },
      round_id: roundId,
    }).lean();

    const submissionMap = new Map(
      submissions.map((s: any) => [s.team_id.toString(), s]),
    );

    const submissionIds = submissions.map((s: any) => s._id);
    const scores = await Score.find({
      judge_id: (judge as any)._id,
      submission_id: { $in: submissionIds },
    }).lean();

    const scoreMap = new Map(
      scores.map((sc: any) => [sc.submission_id.toString(), sc]),
    );

    const result = teams.map((team: any) => {
      const submission = submissionMap.get(team._id.toString());
      const score = submission
        ? scoreMap.get(submission._id.toString())
        : null;

      return {
        team_id: team._id.toString(),
        team_name: team.team_name,
        has_submission: !!submission,
        status: score ? "scored" : "pending",
        score: score?.score ?? null,
        remarks: score?.remarks ?? "",
      };
    });

    return NextResponse.json(result);
  }

  // ── All rounds: derive status from any score given by this judge ──
  const allSubmissions = await Submission.find({
    team_id: { $in: assignedTeamIds },
  })
    .select("_id team_id")
    .lean();

  const submissionIds = allSubmissions.map((s: any) => s._id);
  const scores = await Score.find({
    judge_id: (judge as any)._id,
    submission_id: { $in: submissionIds },
  }).lean();

  // Build a set of team IDs that have been scored at least once
  const submissionToTeam = new Map(
    allSubmissions.map((s: any) => [s._id.toString(), s.team_id.toString()]),
  );
  const scoredTeamIds = new Set(
    scores.map((sc: any) =>
      submissionToTeam.get(sc.submission_id.toString()),
    ),
  );

  const result = teams.map((team: any) => ({
    team_id: team._id.toString(),
    team_name: team.team_name,
    status: scoredTeamIds.has(team._id.toString()) ? "scored" : "pending",
    score: null, // aggregate score not computed here
  }));

  return NextResponse.json(result);
}

export const GET = proxy(GETHandler, ["judge", "admin"]);
