import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Team from "@/models/Team";
import Round from "@/models/Round";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import { proxy } from "@/lib/proxy";

async function GETHandler() {
  await connectDB();

  try {
    // 1. Total Teams
    const totalTeams = await Team.countDocuments({});

    // 2. Current/Active Round
    let currentRound = await Round.findOne({ is_active: true });

    // If no active round, get the upcoming one or the last ended one
    if (!currentRound) {
      // Try to find one that hasn't started yet
      currentRound = await Round.findOne({
        start_time: { $gt: new Date() },
      }).sort({ start_time: 1 });

      // If no upcoming, get the last one
      if (!currentRound) {
        currentRound = await Round.findOne({}).sort({ end_time: -1 });
      }
    }

    let submissionsCount = 0;
    let pendingEvaluationCount = 0;
    let roundStatus = "inactive";

    if (currentRound) {
      if (currentRound.is_active) roundStatus = "active";
      else if (currentRound.end_time && new Date() > currentRound.end_time)
        roundStatus = "completed";
      else roundStatus = "upcoming";

      // 3. Submissions for current round
      submissionsCount = await Submission.countDocuments({
        round_id: currentRound._id,
      });

      // 4. Pending Evaluations
      // Submissions that have no scores or pending scores
      const allSubmissionsForRound = await Submission.find({
        round_id: currentRound._id,
      }).lean();

      const scoredSubmissionIds = await Score.distinct("submission_id", {
        status: "scored",
      });

      const scoredSubmissionIdsSet = new Set(
        scoredSubmissionIds.map((id) => id.toString()),
      );

      pendingEvaluationCount = allSubmissionsForRound.filter(
        (sub) => !scoredSubmissionIdsSet.has(sub._id.toString()),
      ).length;
    }

    // 5. Get top 5 teams based on cumulative score across all rounds
    const allScores = await Score.find({})
      .populate({
        path: "submission_id",
        select: "team_id",
      })
      .lean();

    // Group scores by team and sum them up
    const teamsScoreMap = new Map<string, number>();
    allScores.forEach((score: any) => {
      if (score.submission_id && score.submission_id.team_id) {
        const teamId = score.submission_id.team_id.toString();
        const currentScore = teamsScoreMap.get(teamId) || 0;
        teamsScoreMap.set(teamId, currentScore + (score.score || 0));
      }
    });

    // Convert to array, sort by score descending, and get top 5
    const topTeams = await Promise.all(
      Array.from(teamsScoreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([teamId, cumulativeScore]) => {
          const team = await Team.findById(teamId)
            .populate("track_id", "name")
            .lean();
          return {
            id: teamId,
            name: team?.team_name || "Unknown",
            cumulativeScore,
            track: (team?.track_id as any)?.name || "—",
          };
        }),
    );

    const stats = {
      totalTeams,
      currentRound: currentRound
        ? {
            id: currentRound._id,
            name: `Round ${currentRound.round_number}`,
            round_number: currentRound.round_number,
          }
        : null,
      roundStatus,
      submissionsCount,
      pendingEvaluationCount,
      topTeams,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);
