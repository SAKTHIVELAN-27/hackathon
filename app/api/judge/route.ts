import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Judge from "@/models/Judge";
import Team from "@/models/Team";
import Round from "@/models/Round";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { proxy } from "@/lib/proxy";

async function GETHandler(request: NextRequest) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Get user and judge information
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const judge = await Judge.findOne({ user_id: user._id })
      .populate("user_id", "email")
      .populate("track_id", "name description")
      .populate("teams_assigned", "team_name track_id")
      .lean();

    if (!judge) {
      return NextResponse.json({ error: "Judge not found" }, { status: 404 });
    }

    // Get active round
    const activeRound = await Round.findOne({ is_active: true }).lean();

    // Get all teams assigned to this judge
    const assignedTeamIds = judge.teams_assigned?.map((t: any) => t._id) || [];

    // Get submissions count and status for assigned teams
    const totalSubmissions = await Submission.countDocuments({
      team_id: { $in: assignedTeamIds },
    });

    // Get all scores given by this judge
    const allScores = await Score.find({
      judge_id: judge._id,
    }).lean();

    const scoredSubmissions = allScores.length;
    const totalScore = allScores.reduce(
      (sum: number, s: any) => sum + (s.score || 0),
      0,
    );
    const averageScore =
      scoredSubmissions > 0 ? (totalScore / scoredSubmissions).toFixed(2) : 0;

    // Get pending submissions (submitted but not scored by this judge)
    const submissionIds = await Submission.find({
      team_id: { $in: assignedTeamIds },
    })
      .select("_id")
      .lean()
      .then((subs: any[]) => subs.map((s) => s._id));

    const scoredSubmissionIds = allScores.map((s: any) => s.submission_id);
    const pendingSubmissions = submissionIds.filter(
      (id: any) => !scoredSubmissionIds.includes(id.toString()),
    ).length;

    // Get current round statistics
    let currentRoundStats = {
      round_id: null,
      round_number: null,
      submissions_in_round: 0,
      scores_in_round: 0,
      pending_in_round: 0,
    };

    if (activeRound) {
      const roundSubmissions = await Submission.find({
        team_id: { $in: assignedTeamIds },
        round_id: activeRound._id,
      }).lean();

      const roundScores = allScores.filter((s: any) =>
        roundSubmissions.some((sub: any) => sub._id.equals(s.submission_id)),
      );

      currentRoundStats = {
        round_id: activeRound._id.toString(),
        round_number: activeRound.round_number,
        submissions_in_round: roundSubmissions.length,
        scores_in_round: roundScores.length,
        pending_in_round: roundSubmissions.length - roundScores.length,
      };
    }

    return NextResponse.json({
      judge: {
        id: judge._id.toString(),
        name: judge.judge_name,
        email: (judge.user_id as any)?.email,
        track: (judge.track_id as any)?.name || "N/A",
        track_description: (judge.track_id as any)?.description || "",
      },
      teams_assigned: {
        count: assignedTeamIds.length,
        teams:
          (judge.teams_assigned as any[])?.map((t: any) => ({
            id: t._id.toString(),
            name: t.team_name,
          })) || [],
      },
      active_round: activeRound
        ? {
            id: activeRound._id.toString(),
            round_number: activeRound.round_number,
            is_active: activeRound.is_active,
            start_time: activeRound.start_time,
            end_time: activeRound.end_time,
          }
        : null,
      statistics: {
        total_submissions: totalSubmissions,
        total_scores_given: scoredSubmissions,
        pending_reviews: pendingSubmissions,
        average_score: parseFloat(averageScore as string),
      },
      current_round_stats: currentRoundStats,
    });
  } catch (error) {
    console.error("Error fetching judge dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch judge dashboard" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["judge", "admin"]);
