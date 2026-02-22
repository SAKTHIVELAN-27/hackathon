import { connectDB } from "@/config/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import Judge from "@/models/Judge";
import Team from "@/models/Team";
import Round from "@/models/Round";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import RoundOptions from "@/models/RoundOptions";
import { proxy } from "@/lib/proxy";

async function getJudgeFromSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await User.findOne({ email: session.user.email });
  if (!user) return null;

  const judge = await Judge.findOne({ user_id: user._id });
  if (!judge) return null;

  return { judge, user };
}

/* =========================
   GET ALL TEAMS FOR A ROUND
========================= */

async function GETHandler(
  _req: NextRequest,
  context: { params: Promise<{ round_id: string }> },
) {
  await connectDB();

  const { round_id: paramRoundId } = await context.params;

  let round_id = paramRoundId;

  // Handle "active" keyword
  if (round_id === "active") {
    const activeRound = await Round.findOne({ is_active: true });
    if (activeRound) {
      round_id = activeRound._id.toString();
    } else {
      return NextResponse.json(
        { error: "No active round found" },
        { status: 404 },
      );
    }
  }

  // Verify round exists
  const round = await Round.findById(round_id);
  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  // Get the judge
  const judgeSession = await getJudgeFromSession();
  if (!judgeSession?.judge) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Get all teams assigned to this judge
  const assignedTeamIds = judgeSession.judge.teams_assigned || [];

  // Get teams that are assigned to this judge AND have this round accessible
  const teams = await Team.find({
    _id: { $in: assignedTeamIds },
    rounds_accessible: round_id,
  });

  // Build detailed response for each team
  const teamsData = await Promise.all(
    teams.map(async (team: any) => {
      // Get team with track info
      const teamWithTrack = await Team.findById(team._id).populate(
        "track_id",
        "name",
      );

      // Get selected subtask
      const selection = await RoundOptions.findOne({
        team_id: team._id,
        round_id,
      }).populate("selected", "title description");

      // Get submission
      const submission = await Submission.findOne({
        team_id: team._id,
        round_id,
      }).sort({ submitted_at: -1 });

      // Get score if submission exists
      let scoreData = null;
      if (submission) {
        const scoreDoc = await Score.findOne({
          judge_id: judgeSession.judge._id,
          submission_id: submission._id,
        });

        if (scoreDoc) {
          scoreData = {
            score: scoreDoc.score,
            remarks: scoreDoc.remarks || "",
            status: scoreDoc.status || "pending",
            updated_at: scoreDoc.updated_at,
          };
        }
      }

      return {
        team_id: team._id.toString(),
        team_name: team.team_name,
        track: (teamWithTrack?.track_id as any)?.name || "N/A",
        track_id: (teamWithTrack?.track_id as any)?._id?.toString() || null,
        selected_subtask: selection?.selected
          ? {
              id: (selection.selected as any)._id.toString(),
              title: (selection.selected as any).title,
              description: (selection.selected as any).description,
            }
          : null,
        has_submission: !!submission,
        submission_time: submission?.submitted_at || null,
        score: scoreData,
      };
    }),
  );

  return NextResponse.json({
    round: {
      id: round._id.toString(),
      round_number: round.round_number,
      start_time: round.start_time,
      end_time: round.end_time,
      is_active: round.is_active,
    },
    teams: teamsData,
  });
}

export const GET = proxy(GETHandler, ["judge", "admin"]);
