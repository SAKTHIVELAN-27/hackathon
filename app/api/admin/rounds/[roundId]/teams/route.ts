import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/config/db";
import Team from "@/models/Team";
import Submission from "@/models/Submission";
import Score from "@/models/Score";
import RoundOptions from "@/models/RoundOptions";
import { proxy } from "@/lib/proxy";

// GET: Fetch teams for a round, grouped by track with subtask history
async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  await connectDB();
  const { roundId } = await params;

  try {
    // Get all teams with their track information
    const teams = await Team.find({}).populate("track_id", "name").lean();

    // Get submissions for this round
    const submissions = await Submission.find({ round_id: roundId }).lean();
    const submissionMap = new Map(
      submissions.map((sub: any) => [sub.team_id.toString(), sub]),
    );

    // Get scores for submissions in this round
    const submissionIds = submissions.map((s: any) => s._id);
    const scores = await Score.find({
      submission_id: { $in: submissionIds },
    }).lean();
    const scoreMap = new Map(
      scores.map((score: any) => [score.submission_id.toString(), score.score]),
    );

    // Get round options (subtask selections) for this round
    const roundOptions = await RoundOptions.find({ round_id: roundId })
      .populate("selected", "title")
      .populate("options", "title")
      .lean();
    const optionsMap = new Map(
      roundOptions.map((opt: any) => [opt.team_id.toString(), opt]),
    );

    // Group teams by track
    const teamsByTrack: any = {};

    teams.forEach((team: any) => {
      const teamId = team._id.toString();
      const trackName = team.track_id?.name || "Unassigned";
      const submission = submissionMap.get(teamId);
      const score = submission ? scoreMap.get(submission._id.toString()) : null;
      const options = optionsMap.get(teamId);

      const teamData = {
        id: teamId,
        team_name: team.team_name,
        track: trackName,
        track_id: team.track_id?._id?.toString() || null,
        submission: submission
          ? {
              id: submission._id.toString(),
              github_link: submission.github_link,
              file_url: submission.file_url,
              submitted_at: submission.submitted_at,
            }
          : null,
        score: score ?? null,
        subtask_history: options
          ? {
              options: (options.options || []).map((opt: any) => ({
                id: opt._id.toString(),
                title: opt.title,
              })),
              selected: options.selected
                ? {
                    id: options.selected._id.toString(),
                    title: options.selected.title,
                  }
                : null,
              selected_at: options.selected_at,
            }
          : null,
        allowed: (team.rounds_accessible || []).some(
          (r: any) => r.toString() === roundId,
        ),
      };

      if (!teamsByTrack[trackName]) {
        teamsByTrack[trackName] = [];
      }
      teamsByTrack[trackName].push(teamData);
    });

    return NextResponse.json({
      teams_by_track: teamsByTrack,
      total_teams: teams.length,
    });
  } catch (error) {
    console.error("Error fetching round teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch round teams" },
      { status: 500 },
    );
  }
}

export const GET = proxy(GETHandler, ["admin"]);

// POST: Update allowed teams for a round (shortlist teams) and allocate round options
async function POSTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  await connectDB();
  const { roundId } = await params;

  try {
    const body = await request.json();
    const teamIds: string[] = body.teamIds || [];

    // Add round to selected teams' accessible rounds
    await Team.updateMany(
      { _id: { $in: teamIds } },
      { $addToSet: { rounds_accessible: roundId } },
    );

    // Remove round from other teams' accessible rounds
    await Team.updateMany(
      { _id: { $nin: teamIds } },
      { $pull: { rounds_accessible: roundId } },
    );

    return NextResponse.json({
      message: "Teams shortlisted for round successfully",
      shortlisted_count: teamIds.length,
    });
  } catch (error) {
    console.error("Error shortlisting teams:", error);
    return NextResponse.json(
      { error: "Failed to shortlist teams" },
      { status: 500 },
    );
  }
}

export const POST = proxy(POSTHandler, ["admin"]);
